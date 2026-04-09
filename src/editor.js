// ══════════════════════════════════════════════════════════════════════════════
//  FERRUM STUDIO — editor.js
//  Syntax highlighting, snippets, find/replace, editor state management
// ══════════════════════════════════════════════════════════════════════════════

// ── Zig Syntax Highlighting ───────────────────────────────────────────────────

export const ZIG_KEYWORDS = new Set([
  'addrspace','align','allowzero','and','anyframe','anytype','asm','async','await',
  'break','callconv','catch','comptime','const','continue','defer','else','enum',
  'errdefer','error','export','extern','fn','for','if','inline','linksection',
  'noalias','noinline','nosuspend','opaque','or','orelse','packed','pub','resume',
  'return','struct','suspend','switch','test','threadlocal','try','union',
  'unreachable','usingnamespace','var','volatile','while',
])

export const ZIG_TYPES = new Set([
  'bool','void','noreturn','type','anyerror','comptime_int','comptime_float',
  'i8','i16','i32','i64','i128','i256','isize',
  'u8','u16','u32','u64','u128','u256','usize',
  'f16','f32','f64','f80','f128',
  'c_char','c_short','c_ushort','c_int','c_uint','c_long','c_ulong',
  'c_longlong','c_ulonglong','c_longdouble',
  'true','false','undefined','null','std',
])

const X = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')

function hlLine(line) {
  let out = '', i = 0, n = line.length
  // Both open+close in same concat — no unclosed tags
  const tok = (cls, val) => { out += `<span class="${cls}">${X(val)}</span>` }

  while (i < n) {
    const c = line[i]
    // Line comment
    if (c === '/' && line[i+1] === '/') { tok('hc', line.slice(i)); break }
    // String "..."
    if (c === '"') {
      let j = i+1
      while (j < n && !(line[j] === '"' && line[j-1] !== '\\')) j++
      tok('hs', line.slice(i, j+1)); i = j+1; continue
    }
    // Char literal '.'
    if (c === "'") {
      let j = i+1
      while (j < n && !(line[j] === "'" && line[j-1] !== '\\')) j++
      tok('hs', line.slice(i, j+1)); i = j+1; continue
    }
    // Multiline string \\
    if (c === '\\' && line[i+1] === '\\') { tok('hs', line.slice(i)); break }
    // @builtins  and  @"field"
    if (c === '@') {
      if (line[i+1] === '"') {
        let j = i+2; while (j < n && line[j] !== '"') j++
        tok('hb', line.slice(i, j+1)); i = j+1; continue
      }
      const m = line.slice(i).match(/^@[a-zA-Z_]\w*/)
      if (m) { tok('hb', m[0]); i += m[0].length; continue }
    }
    // Numbers: 0x hex, 0b bin, 0o oct, decimal, float
    if (c >= '0' && c <= '9') {
      const m = line.slice(i).match(
        /^0x[0-9a-fA-F_]+|^0b[01_]+|^0o[0-7_]+|^[0-9][0-9_]*(?:\.[0-9_]+)?(?:[eE][+-]?[0-9_]+)?/
      )
      if (m) { tok('hn', m[0]); i += m[0].length; continue }
    }
    // Words
    if ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_') {
      let j = i+1
      while (j < n && /\w/.test(line[j])) j++
      const w = line.slice(i, j)
      const next = line[j]
      if (ZIG_KEYWORDS.has(w))         tok('hk', w)   // keyword
      else if (ZIG_TYPES.has(w))       tok('ht', w)   // builtin type
      else if (/^[A-Z]/.test(w))       tok('hT', w)   // user type (PascalCase)
      else if (next === '(')           tok('hf', w)   // function call
      else                             tok('hi', w)   // identifier
      i = j; continue
    }
    tok('hp', c); i++
  }
  return out || ' '
}

export function hlCode(code, diagsByLine = {}) {
  return code.split('\n').map((line, idx) => {
    const lineNo = idx + 1
    const d = diagsByLine[lineNo]
    const hl = hlLine(line)
    const ghost = d
      ? `<span class="inline-err ie-${d.kind}" title="${X(d.message)}"> ← ${X(d.message)}</span>`
      : ''
    return `<div class="cl">${hl}${ghost}</div>`
  }).join('')
}

export function hlCodePlain(code) {
  return code.split('\n')
    .map(l => `<div class="cl">${X(l) || ' '}</div>`)
    .join('')
}

// ── Snippets ──────────────────────────────────────────────────────────────────

export const SNIPPETS = {
  'fn':        'fn ${1:name}(${2:args}) ${3:!void} {\n    $0\n}',
  'pub fn':    'pub fn ${1:name}(${2:args}) ${3:!void} {\n    $0\n}',
  'struct':    'const ${1:Name} = struct {\n    $0\n};',
  'enum':      'const ${1:Name} = enum {\n    $0\n};',
  'union':     'const ${1:Name} = union(${2:enum}) {\n    $0\n};',
  'test':      'test "${1:description}" {\n    $0\n}',
  'if':        'if (${1:cond}) {\n    $0\n}',
  'ifelse':    'if (${1:cond}) {\n    $0\n} else {\n    \n}',
  'for':       'for (${1:items}) |${2:item}| {\n    $0\n}',
  'fori':      'for (${1:items}, 0..) |${2:item}, ${3:i}| {\n    $0\n}',
  'while':     'while (${1:cond}) {\n    $0\n}',
  'defer':     'defer $0;',
  'errdefer':  'errdefer $0;',
  'std':       'const std = @import("std");',
  'main':      'pub fn main() !void {\n    $0\n}',
  'print':     'std.debug.print("${1:msg}\\n", .{$2});',
  'stdout':    'const stdout = std.io.getStdOut().writer();\ntry stdout.print("${1:msg}\\n", .{$2});',
  'alloc':     'const allocator = std.heap.page_allocator;\n$0',
  'gpa':       'var gpa = std.heap.GeneralPurposeAllocator(.{}){};\ndefer _ = gpa.deinit();\nconst allocator = gpa.allocator();\n$0',
  'ArrayList': 'var ${1:list} = std.ArrayList(${2:T}).init(${3:allocator});\ndefer ${1:list}.deinit();\n$0',
  'HashMap':   'var ${1:map} = std.StringHashMap(${2:T}).init(${3:allocator});\ndefer ${1:map}.deinit();\n$0',
  'switch':    'switch (${1:val}) {\n    ${2:case} => $3,\n    else => $0,\n}',
  'comptime':  'comptime {\n    $0\n}',
  'import':    'const ${1:name} = @import("${2:path}");',
  'log':       'std.log.info("${1:msg}", .{$2});',
  'assert':    'std.debug.assert($0);',
  'expect':    'try std.testing.expect($0);',
  'expectEq':  'try std.testing.expectEqual(${1:expected}, ${2:actual});',
  'catch':     'catch |${1:err}| {\n    $0\n}',
  'orelse':    'orelse {\n    $0\n}',
  'try':       'const ${1:result} = try $0;',
  'type':      'const ${1:T} = ${2:u8};',
}

// Expand snippet at cursor. Returns true if expanded.
export function expandSnippet(ta) {
  const { selectionStart: pos, value } = ta
  const lineStart = value.lastIndexOf('\n', pos - 1) + 1
  const before = value.slice(lineStart, pos)

  let match = null
  for (const key of Object.keys(SNIPPETS)) {
    if (before.endsWith(key) && (!match || key.length > match.length)) {
      match = key
    }
  }
  if (!match) return false

  const template = SNIPPETS[match]
  const start = pos - match.length
  const after = value.slice(pos)

  // Strip all $N placeholders — expand to plain text, cursor at $0
  const expanded = template.replace(/\$\{(\d+):([^}]+)\}/g, '$2').replace(/\$\d/g, '')
  const cursor0 = template.indexOf('$0')
  const beforeCursor = template
    .slice(0, cursor0)
    .replace(/\$\{(\d+):([^}]+)\}/g, '$2')
    .replace(/\$\d/g, '')

  ta.value = value.slice(0, start) + expanded + after
  ta.selectionStart = ta.selectionEnd = start + beforeCursor.length
  ta.dispatchEvent(new Event('input'))
  return true
}

// ── Find/Replace engine ───────────────────────────────────────────────────────

export class Finder {
  constructor() {
    this.matches = []
    this.idx = 0
    this.query = ''
    this.caseSensitive = false
    this.useRegex = false
    this.wholeWord = false
  }

  update(query, text, opts = {}) {
    this.query = query
    this.caseSensitive = opts.caseSensitive || false
    this.useRegex = opts.useRegex || false
    this.wholeWord = opts.wholeWord || false
    this.matches = []
    this.idx = 0
    if (!query || !text) return

    try {
      let pattern = query
      if (!this.useRegex) pattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      if (this.wholeWord) pattern = `\\b${pattern}\\b`
      const flags = this.caseSensitive ? 'g' : 'gi'
      const re = new RegExp(pattern, flags)
      let m
      while ((m = re.exec(text)) !== null) {
        this.matches.push({ start: m.index, end: m.index + m[0].length })
      }
    } catch (_) {}
  }

  get count() { return this.matches.length }
  get current() { return this.matches[this.idx] || null }
  get displayIdx() { return this.matches.length ? this.idx + 1 : 0 }

  next() {
    if (!this.matches.length) return null
    this.idx = (this.idx + 1) % this.matches.length
    return this.current
  }
  prev() {
    if (!this.matches.length) return null
    this.idx = (this.idx - 1 + this.matches.length) % this.matches.length
    return this.current
  }
  first() {
    this.idx = 0
    return this.current
  }

  // Apply a match to the textarea
  applyTo(ta) {
    const m = this.current
    if (!m || !ta) return
    ta.focus()
    ta.setSelectionRange(m.start, m.end)
    const linesBefore = ta.value.slice(0, m.start).split('\n').length - 1
    ta.scrollTop = Math.max(0, (linesBefore - 5) * 22)
  }

  replace(ta, replacement) {
    const m = this.current
    if (!m || !ta) return
    const v = ta.value
    ta.value = v.slice(0, m.start) + replacement + v.slice(m.end)
    ta.selectionStart = ta.selectionEnd = m.start + replacement.length
    ta.dispatchEvent(new Event('input'))
    // Re-search after replacement
    this.update(this.query, ta.value, {
      caseSensitive: this.caseSensitive,
      useRegex: this.useRegex,
      wholeWord: this.wholeWord,
    })
  }

  replaceAll(ta, replacement) {
    if (!ta || !this.matches.length) return 0
    let v = ta.value
    let offset = 0
    let count = 0
    for (const m of this.matches) {
      const start = m.start + offset
      const end = m.end + offset
      v = v.slice(0, start) + replacement + v.slice(end)
      offset += replacement.length - (m.end - m.start)
      count++
    }
    ta.value = v
    ta.dispatchEvent(new Event('input'))
    this.matches = []
    return count
  }
}

// ── Editor key helpers ────────────────────────────────────────────────────────

export function handleEditorKey(e, ta) {
  // Tab / Shift-Tab
  if (e.key === 'Tab') {
    e.preventDefault()
    const { selectionStart: s, selectionEnd: end, value: v } = ta
    if (e.shiftKey) {
      // Unindent: remove up to 4 spaces from line start
      const ls = v.lastIndexOf('\n', s - 1) + 1
      const spaces = Math.min(4, v.slice(ls).match(/^( *)/)[1].length)
      if (spaces > 0) {
        ta.value = v.slice(0, ls) + v.slice(ls + spaces)
        ta.selectionStart = ta.selectionEnd = Math.max(ls, s - spaces)
        ta.dispatchEvent(new Event('input'))
      }
    } else if (s === end && expandSnippet(ta)) {
      // Snippet expanded
    } else {
      ta.value = v.slice(0, s) + '    ' + v.slice(end)
      ta.selectionStart = ta.selectionEnd = s + 4
      ta.dispatchEvent(new Event('input'))
    }
    return true
  }

  // Enter — smart indent
  if (e.key === 'Enter') {
    e.preventDefault()
    const { selectionStart: s, value: v } = ta
    const ls = v.lastIndexOf('\n', s - 1) + 1
    const line = v.slice(ls, s)
    const indent = line.match(/^(\s*)/)[1]
    const extra = /[{(\[]$/.test(line.trimEnd()) ? '    ' : ''
    // Auto-close: if previous char opens a block, add closing on next line
    const ins = '\n' + indent + extra
    ta.value = v.slice(0, s) + ins + v.slice(ta.selectionEnd)
    ta.selectionStart = ta.selectionEnd = s + ins.length
    ta.dispatchEvent(new Event('input'))
    return true
  }

  // Auto-close pairs
  const PAIRS = { '(': ')', '{': '}', '[': ']' }
  if (PAIRS[e.key]) {
    const { selectionStart: s, selectionEnd: end, value: v } = ta
    if (s === end) {
      e.preventDefault()
      ta.value = v.slice(0, s) + e.key + PAIRS[e.key] + v.slice(end)
      ta.selectionStart = ta.selectionEnd = s + 1
      ta.dispatchEvent(new Event('input'))
      return true
    }
  }

  // Skip over closing bracket if next char matches
  const CLOSES = new Set([')', '}', ']'])
  if (CLOSES.has(e.key)) {
    const { selectionStart: s, value: v } = ta
    if (v[s] === e.key) {
      e.preventDefault()
      ta.selectionStart = ta.selectionEnd = s + 1
      return true
    }
  }

  return false
}

export function selectNextOccurrence(ta) {
  const { selectionStart: start, selectionEnd: end, value } = ta
  if (start === end) {
    // Select current word
    let l = start, r = start
    while (l > 0 && /\w/.test(value[l-1])) l--
    while (r < value.length && /\w/.test(value[r])) r++
    if (l < r) ta.setSelectionRange(l, r)
    return
  }
  const word = value.slice(start, end)
  const idx = value.indexOf(word, end)
  const target = idx !== -1 ? idx : value.indexOf(word)
  if (target !== -1 && target !== start) {
    ta.setSelectionRange(target, target + word.length)
    const line = value.slice(0, target).split('\n').length - 1
    ta.scrollTop = Math.max(0, (line - 5) * 22)
  }
}

export function duplicateLine(ta) {
  const { selectionStart: s, value: v } = ta
  const ls = v.lastIndexOf('\n', s - 1) + 1
  const le = v.indexOf('\n', s)
  const end = le === -1 ? v.length : le
  const line = v.slice(ls, end)
  const ins = '\n' + line
  ta.value = v.slice(0, end) + ins + v.slice(end)
  ta.selectionStart = ta.selectionEnd = end + ins.length - line.length + (s - ls)
  ta.dispatchEvent(new Event('input'))
}

export function toggleLineComment(ta) {
  const { selectionStart: s, selectionEnd: end, value: v } = ta
  const ls = v.lastIndexOf('\n', s - 1) + 1
  const line = v.slice(ls, v.indexOf('\n', s) === -1 ? v.length : v.indexOf('\n', s))
  const trimmed = line.trimStart()
  const indent = line.slice(0, line.length - trimmed.length)
  let newLine, delta
  if (trimmed.startsWith('// ')) {
    newLine = indent + trimmed.slice(3)
    delta = -3
  } else if (trimmed.startsWith('//')) {
    newLine = indent + trimmed.slice(2)
    delta = -2
  } else {
    newLine = indent + '// ' + trimmed
    delta = 3
  }
  const le = v.indexOf('\n', s)
  const lineEnd = le === -1 ? v.length : le
  ta.value = v.slice(0, ls) + newLine + v.slice(lineEnd)
  ta.selectionStart = ta.selectionEnd = s + delta
  ta.dispatchEvent(new Event('input'))
}