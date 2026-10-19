#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const skillsRoot = path.join(root, 'skills');
const errors = [];
const markdownFiles = [];
const coverageRows = [];
const writeReport = process.argv.includes('--write-report');

// Only trust documentation owned by the framework, its official ecosystem
// projects, standards bodies, browser documentation, and the named tool authors.
const primaryHosts = new Set([
  'developer.mozilla.org',
  'typescriptlang.org',
  'www.typescriptlang.org',
  'tailwindcss.com',
  'v3.tailwindcss.com',
  'pinia.vuejs.org',
  'router.vuejs.org',
  'test-utils.vuejs.org',
  'vitest.dev',
  'playwright.dev',
  'vitejs.dev',
  'nuxt.com',
  'vueuse.org',
  'tanstack.com',
  'vue-virtual-scroller.netlify.app',
  'gsap.com',
  'element-plus.org',
  'auto-animate.formkit.com',
  'testing-library.com',
  'devblogs.microsoft.com',
  'mswjs.io',
]);

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(fullPath);
    else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
      markdownFiles.push(fullPath);
    }
  }
}

function linesOutsideFences(source, file) {
  const lines = source.split(/\r?\n/);
  const result = [];
  let fence = null;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const marker = line.match(/^\s{0,3}(`{3,}|~{3,})(.*)$/);

    if (!fence && marker) {
      fence = { char: marker[1][0], length: marker[1].length, line: index + 1 };
      continue;
    }

    if (fence) {
      if (marker && marker[1][0] === fence.char && marker[1].length >= fence.length && /^\s*$/.test(marker[2])) {
        fence = null;
      }
      continue;
    }

    result.push({ text: line, line: index + 1 });
  }

  if (fence) errors.push(`${relative(file)}:${fence.line}: unclosed fenced code block`);
  return result;
}

function relative(file) {
  return path.relative(root, file).split(path.sep).join('/');
}

function slugHeading(heading) {
  return heading
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]*>/g, '')
    .replace(/<[^\s>]+>/g, '')
    .replace(/&[a-z]+;/gi, '')
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}_\-\s]/gu, '')
    .replace(/\s+/g, '-');
}

function anchorsFor(source, file) {
  const anchors = new Set();
  const counts = new Map();
  const lines = source.split(/\r?\n/);
  let fence = null;

  for (const line of lines) {
    const marker = line.match(/^\s{0,3}(`{3,}|~{3,})(.*)$/);
    if (!fence && marker) {
      fence = { char: marker[1][0], length: marker[1].length };
      continue;
    }
    if (fence) {
      if (marker && marker[1][0] === fence.char && marker[1].length >= fence.length && /^\s*$/.test(marker[2])) fence = null;
      continue;
    }

    const heading = line.match(/^\s{0,3}#{1,6}\s+(.+?)\s*#*\s*$/);
    if (heading) {
      const base = slugHeading(heading[1]);
      const duplicate = counts.get(base) ?? 0;
      counts.set(base, duplicate + 1);
      anchors.add(duplicate === 0 ? base : `${base}-${duplicate}`);
    }

    for (const match of line.matchAll(/<(?:a|span)\s+[^>]*id=["']([^"']+)["'][^>]*>/gi)) anchors.add(match[1]);
  }

  return anchors;
}

function isPrimarySource(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }

  const host = parsed.hostname.toLowerCase();
  if (host === 'vuejs.org' || host.endsWith('.vuejs.org')) return true;
  if (primaryHosts.has(host)) return true;
  if (host === 'github.com' && /^\/(vuejs|vueuse|piniajs)\//i.test(parsed.pathname)) return true;
  return false;
}

function validateMarkdown(file) {
  const source = fs.readFileSync(file, 'utf8');
  const fileName = relative(file);
  const visibleLines = linesOutsideFences(source, file);
  const urls = [...source.matchAll(/https?:\/\/[^\s)<>"']+/g)].map((match) => match[0].replace(/[.,;]+$/, ''));
  const primaryUrls = [...new Set(urls.filter(isPrimarySource))].sort();
  coverageRows.push({ fileName, primaryUrls });

  if (!source.trim()) errors.push(`${fileName}: empty Markdown file`);
  if (primaryUrls.length === 0) errors.push(`${fileName}: no link to an allowlisted primary source`);

  if (path.basename(file).toLowerCase() === 'skill.md') {
    const frontmatter = source.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)/)?.[1];
    if (frontmatter === undefined) {
      errors.push(`${fileName}: missing YAML frontmatter`);
    } else {
      if (!/^name:\s*\S+/m.test(frontmatter)) errors.push(`${fileName}: frontmatter missing name`);
      if (!/^description:\s*\S+/m.test(frontmatter)) errors.push(`${fileName}: frontmatter missing description`);
    }
  }

  const ownAnchors = anchorsFor(source, file);
  for (const { text, line } of visibleLines) {
    for (const match of text.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/g)) {
      let destination = match[1].trim().replace(/^<|>$/g, '').split(/\s+/)[0];
      if (!destination || /^(?:https?:|mailto:|tel:|data:|javascript:)/i.test(destination)) continue;

      const hashIndex = destination.indexOf('#');
      const filePart = hashIndex >= 0 ? destination.slice(0, hashIndex) : destination;
      const fragment = hashIndex >= 0 ? decodeURIComponent(destination.slice(hashIndex + 1)) : '';

      if (!filePart) {
        if (fragment && !ownAnchors.has(fragment)) errors.push(`${fileName}:${line}: missing heading anchor #${fragment}`);
        continue;
      }

      const decodedPath = decodeURIComponent(filePart.split('?')[0]);
      const target = path.resolve(path.dirname(file), decodedPath);
      if (!fs.existsSync(target)) {
        errors.push(`${fileName}:${line}: broken local link ${filePart}`);
        continue;
      }

      if (fragment && path.extname(target).toLowerCase() === '.md') {
        const targetAnchors = target === file ? ownAnchors : anchorsFor(fs.readFileSync(target, 'utf8'), target);
        if (!targetAnchors.has(fragment)) errors.push(`${fileName}:${line}: missing anchor #${fragment} in ${filePart}`);
      }
    }
  }
}

function validateMarketplace() {
  const file = path.join(root, '.claude-plugin', 'marketplace.json');
  if (!fs.existsSync(file)) {
    errors.push('.claude-plugin/marketplace.json: missing marketplace manifest');
    return;
  }

  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    errors.push(`.claude-plugin/marketplace.json: invalid JSON (${error.message})`);
    return;
  }

  if (!manifest.name || !manifest.owner?.name || !Array.isArray(manifest.plugins)) {
    errors.push('.claude-plugin/marketplace.json: expected name, owner.name, and plugins');
    return;
  }

  const names = new Set();
  for (const plugin of manifest.plugins) {
    if (!plugin.name || !plugin.source || !plugin.description) {
      errors.push('.claude-plugin/marketplace.json: every plugin needs name, source, and description');
      continue;
    }
    if (names.has(plugin.name)) errors.push(`.claude-plugin/marketplace.json: duplicate plugin name ${plugin.name}`);
    names.add(plugin.name);

    if (typeof plugin.source !== 'string') {
      errors.push(`.claude-plugin/marketplace.json: only local relative plugin sources are currently validated (${plugin.name})`);
      continue;
    }

    const pluginPath = path.resolve(root, plugin.source);
    const relativePluginPath = path.relative(root, pluginPath);
    if (relativePluginPath === '..' || relativePluginPath.startsWith(`..${path.sep}`) || path.isAbsolute(relativePluginPath)) {
      errors.push(`.claude-plugin/marketplace.json: plugin source escapes repository: ${plugin.source}`);
    } else if (!fs.existsSync(pluginPath)) {
      errors.push(`.claude-plugin/marketplace.json: missing plugin source ${plugin.source}`);
      continue;
    } else {
      const pluginManifestPath = path.join(pluginPath, '.claude-plugin', 'plugin.json');
      if (fs.existsSync(pluginManifestPath)) {
        try {
          const pluginManifest = JSON.parse(fs.readFileSync(pluginManifestPath, 'utf8'));
          if (pluginManifest.name !== plugin.name) {
            errors.push(`.claude-plugin/marketplace.json: plugin entry ${plugin.name} does not match plugin.json name ${pluginManifest.name ?? '(missing)'}`);
          }
        } catch (error) {
          errors.push(`${relative(pluginManifestPath)}: invalid JSON (${error.message})`);
        }
      }

      // Claude Code accepts a skill directly at a plugin root, or skills in
      // the default skills/ component directory. A marketplace entry itself
      // acts as the plugin manifest when plugin.json is absent.
      const hasRootSkill = fs.existsSync(path.join(pluginPath, 'SKILL.md'));
      const skillsPath = path.join(pluginPath, 'skills');
      const hasNestedSkills = fs.existsSync(skillsPath) && fs.statSync(skillsPath).isDirectory()
        && fs.readdirSync(skillsPath, { withFileTypes: true }).some((entry) => entry.isDirectory()
          && fs.existsSync(path.join(skillsPath, entry.name, 'SKILL.md')));
      if (!hasRootSkill && !hasNestedSkills) {
        errors.push(`.claude-plugin/marketplace.json: plugin source has no root or default-layout skills: ${plugin.source}`);
      }
    }
  }
}

if (!fs.existsSync(skillsRoot)) {
  console.error('ERROR: skills/ directory not found');
  process.exit(1);
}

walk(skillsRoot);
markdownFiles.sort();
for (const file of markdownFiles) validateMarkdown(file);
validateMarketplace();

const skillFiles = markdownFiles.filter((file) => path.basename(file).toLowerCase() === 'skill.md');
const referenceFiles = markdownFiles.length - skillFiles.length;

if (writeReport && errors.length === 0) {
  const reportPath = path.join(root, 'docs', 'source-coverage.csv');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  const quote = (value) => `"${String(value).replaceAll('"', '""')}"`;
  const rows = [
    'markdown_file,primary_source_urls',
    ...coverageRows
      .sort((a, b) => a.fileName.localeCompare(b.fileName))
      .map(({ fileName, primaryUrls }) => `${quote(fileName)},${quote(primaryUrls.join(' | '))}`),
  ];
  fs.writeFileSync(reportPath, `${rows.join('\n')}\n`, 'utf8');
}

if (errors.length) {
  console.error(`FAIL: ${errors.length} issue(s) across ${markdownFiles.length} Markdown files (${skillFiles.length} skills, ${referenceFiles} references).`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`PASS: ${markdownFiles.length} Markdown files (${skillFiles.length} skills, ${referenceFiles} references).`);
  console.log('PASS: skill frontmatter delimiters/name/description, fenced code blocks, local links/anchors, primary-source URL coverage, and Claude marketplace/plugin skill paths.');
  if (writeReport) console.log('WROTE: docs/source-coverage.csv');
}
