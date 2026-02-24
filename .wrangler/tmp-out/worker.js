var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// node_modules/unenv/dist/runtime/_internal/utils.mjs
// @__NO_SIDE_EFFECTS__
function createNotImplementedError(name) {
  return new Error(`[unenv] ${name} is not implemented yet!`);
}
__name(createNotImplementedError, "createNotImplementedError");
// @__NO_SIDE_EFFECTS__
function notImplemented(name) {
  const fn = /* @__PURE__ */ __name(() => {
    throw /* @__PURE__ */ createNotImplementedError(name);
  }, "fn");
  return Object.assign(fn, { __unenv__: true });
}
__name(notImplemented, "notImplemented");
// @__NO_SIDE_EFFECTS__
function notImplementedClass(name) {
  return class {
    __unenv__ = true;
    constructor() {
      throw new Error(`[unenv] ${name} is not implemented yet!`);
    }
  };
}
__name(notImplementedClass, "notImplementedClass");

// node_modules/unenv/dist/runtime/node/internal/perf_hooks/performance.mjs
var _timeOrigin = globalThis.performance?.timeOrigin ?? Date.now();
var _performanceNow = globalThis.performance?.now ? globalThis.performance.now.bind(globalThis.performance) : () => Date.now() - _timeOrigin;
var nodeTiming = {
  name: "node",
  entryType: "node",
  startTime: 0,
  duration: 0,
  nodeStart: 0,
  v8Start: 0,
  bootstrapComplete: 0,
  environment: 0,
  loopStart: 0,
  loopExit: 0,
  idleTime: 0,
  uvMetricsInfo: {
    loopCount: 0,
    events: 0,
    eventsWaiting: 0
  },
  detail: void 0,
  toJSON() {
    return this;
  }
};
var PerformanceEntry = class {
  static {
    __name(this, "PerformanceEntry");
  }
  __unenv__ = true;
  detail;
  entryType = "event";
  name;
  startTime;
  constructor(name, options) {
    this.name = name;
    this.startTime = options?.startTime || _performanceNow();
    this.detail = options?.detail;
  }
  get duration() {
    return _performanceNow() - this.startTime;
  }
  toJSON() {
    return {
      name: this.name,
      entryType: this.entryType,
      startTime: this.startTime,
      duration: this.duration,
      detail: this.detail
    };
  }
};
var PerformanceMark = class PerformanceMark2 extends PerformanceEntry {
  static {
    __name(this, "PerformanceMark");
  }
  entryType = "mark";
  constructor() {
    super(...arguments);
  }
  get duration() {
    return 0;
  }
};
var PerformanceMeasure = class extends PerformanceEntry {
  static {
    __name(this, "PerformanceMeasure");
  }
  entryType = "measure";
};
var PerformanceResourceTiming = class extends PerformanceEntry {
  static {
    __name(this, "PerformanceResourceTiming");
  }
  entryType = "resource";
  serverTiming = [];
  connectEnd = 0;
  connectStart = 0;
  decodedBodySize = 0;
  domainLookupEnd = 0;
  domainLookupStart = 0;
  encodedBodySize = 0;
  fetchStart = 0;
  initiatorType = "";
  name = "";
  nextHopProtocol = "";
  redirectEnd = 0;
  redirectStart = 0;
  requestStart = 0;
  responseEnd = 0;
  responseStart = 0;
  secureConnectionStart = 0;
  startTime = 0;
  transferSize = 0;
  workerStart = 0;
  responseStatus = 0;
};
var PerformanceObserverEntryList = class {
  static {
    __name(this, "PerformanceObserverEntryList");
  }
  __unenv__ = true;
  getEntries() {
    return [];
  }
  getEntriesByName(_name, _type) {
    return [];
  }
  getEntriesByType(type) {
    return [];
  }
};
var Performance = class {
  static {
    __name(this, "Performance");
  }
  __unenv__ = true;
  timeOrigin = _timeOrigin;
  eventCounts = /* @__PURE__ */ new Map();
  _entries = [];
  _resourceTimingBufferSize = 0;
  navigation = void 0;
  timing = void 0;
  timerify(_fn, _options) {
    throw createNotImplementedError("Performance.timerify");
  }
  get nodeTiming() {
    return nodeTiming;
  }
  eventLoopUtilization() {
    return {};
  }
  markResourceTiming() {
    return new PerformanceResourceTiming("");
  }
  onresourcetimingbufferfull = null;
  now() {
    if (this.timeOrigin === _timeOrigin) {
      return _performanceNow();
    }
    return Date.now() - this.timeOrigin;
  }
  clearMarks(markName) {
    this._entries = markName ? this._entries.filter((e) => e.name !== markName) : this._entries.filter((e) => e.entryType !== "mark");
  }
  clearMeasures(measureName) {
    this._entries = measureName ? this._entries.filter((e) => e.name !== measureName) : this._entries.filter((e) => e.entryType !== "measure");
  }
  clearResourceTimings() {
    this._entries = this._entries.filter((e) => e.entryType !== "resource" || e.entryType !== "navigation");
  }
  getEntries() {
    return this._entries;
  }
  getEntriesByName(name, type) {
    return this._entries.filter((e) => e.name === name && (!type || e.entryType === type));
  }
  getEntriesByType(type) {
    return this._entries.filter((e) => e.entryType === type);
  }
  mark(name, options) {
    const entry = new PerformanceMark(name, options);
    this._entries.push(entry);
    return entry;
  }
  measure(measureName, startOrMeasureOptions, endMark) {
    let start;
    let end;
    if (typeof startOrMeasureOptions === "string") {
      start = this.getEntriesByName(startOrMeasureOptions, "mark")[0]?.startTime;
      end = this.getEntriesByName(endMark, "mark")[0]?.startTime;
    } else {
      start = Number.parseFloat(startOrMeasureOptions?.start) || this.now();
      end = Number.parseFloat(startOrMeasureOptions?.end) || this.now();
    }
    const entry = new PerformanceMeasure(measureName, {
      startTime: start,
      detail: {
        start,
        end
      }
    });
    this._entries.push(entry);
    return entry;
  }
  setResourceTimingBufferSize(maxSize) {
    this._resourceTimingBufferSize = maxSize;
  }
  addEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.addEventListener");
  }
  removeEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.removeEventListener");
  }
  dispatchEvent(event) {
    throw createNotImplementedError("Performance.dispatchEvent");
  }
  toJSON() {
    return this;
  }
};
var PerformanceObserver = class {
  static {
    __name(this, "PerformanceObserver");
  }
  __unenv__ = true;
  static supportedEntryTypes = [];
  _callback = null;
  constructor(callback) {
    this._callback = callback;
  }
  takeRecords() {
    return [];
  }
  disconnect() {
    throw createNotImplementedError("PerformanceObserver.disconnect");
  }
  observe(options) {
    throw createNotImplementedError("PerformanceObserver.observe");
  }
  bind(fn) {
    return fn;
  }
  runInAsyncScope(fn, thisArg, ...args) {
    return fn.call(thisArg, ...args);
  }
  asyncId() {
    return 0;
  }
  triggerAsyncId() {
    return 0;
  }
  emitDestroy() {
    return this;
  }
};
var performance = globalThis.performance && "addEventListener" in globalThis.performance ? globalThis.performance : new Performance();

// node_modules/@cloudflare/unenv-preset/dist/runtime/polyfill/performance.mjs
globalThis.performance = performance;
globalThis.Performance = Performance;
globalThis.PerformanceEntry = PerformanceEntry;
globalThis.PerformanceMark = PerformanceMark;
globalThis.PerformanceMeasure = PerformanceMeasure;
globalThis.PerformanceObserver = PerformanceObserver;
globalThis.PerformanceObserverEntryList = PerformanceObserverEntryList;
globalThis.PerformanceResourceTiming = PerformanceResourceTiming;

// node_modules/unenv/dist/runtime/node/console.mjs
import { Writable } from "node:stream";

// node_modules/unenv/dist/runtime/mock/noop.mjs
var noop_default = Object.assign(() => {
}, { __unenv__: true });

// node_modules/unenv/dist/runtime/node/console.mjs
var _console = globalThis.console;
var _ignoreErrors = true;
var _stderr = new Writable();
var _stdout = new Writable();
var log = _console?.log ?? noop_default;
var info = _console?.info ?? log;
var trace = _console?.trace ?? info;
var debug = _console?.debug ?? log;
var table = _console?.table ?? log;
var error = _console?.error ?? log;
var warn = _console?.warn ?? error;
var createTask = _console?.createTask ?? /* @__PURE__ */ notImplemented("console.createTask");
var clear = _console?.clear ?? noop_default;
var count = _console?.count ?? noop_default;
var countReset = _console?.countReset ?? noop_default;
var dir = _console?.dir ?? noop_default;
var dirxml = _console?.dirxml ?? noop_default;
var group = _console?.group ?? noop_default;
var groupEnd = _console?.groupEnd ?? noop_default;
var groupCollapsed = _console?.groupCollapsed ?? noop_default;
var profile = _console?.profile ?? noop_default;
var profileEnd = _console?.profileEnd ?? noop_default;
var time = _console?.time ?? noop_default;
var timeEnd = _console?.timeEnd ?? noop_default;
var timeLog = _console?.timeLog ?? noop_default;
var timeStamp = _console?.timeStamp ?? noop_default;
var Console = _console?.Console ?? /* @__PURE__ */ notImplementedClass("console.Console");
var _times = /* @__PURE__ */ new Map();
var _stdoutErrorHandler = noop_default;
var _stderrErrorHandler = noop_default;

// node_modules/@cloudflare/unenv-preset/dist/runtime/node/console.mjs
var workerdConsole = globalThis["console"];
var {
  assert,
  clear: clear2,
  // @ts-expect-error undocumented public API
  context,
  count: count2,
  countReset: countReset2,
  // @ts-expect-error undocumented public API
  createTask: createTask2,
  debug: debug2,
  dir: dir2,
  dirxml: dirxml2,
  error: error2,
  group: group2,
  groupCollapsed: groupCollapsed2,
  groupEnd: groupEnd2,
  info: info2,
  log: log2,
  profile: profile2,
  profileEnd: profileEnd2,
  table: table2,
  time: time2,
  timeEnd: timeEnd2,
  timeLog: timeLog2,
  timeStamp: timeStamp2,
  trace: trace2,
  warn: warn2
} = workerdConsole;
Object.assign(workerdConsole, {
  Console,
  _ignoreErrors,
  _stderr,
  _stderrErrorHandler,
  _stdout,
  _stdoutErrorHandler,
  _times
});
var console_default = workerdConsole;

// node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-console
globalThis.console = console_default;

// node_modules/unenv/dist/runtime/node/internal/process/hrtime.mjs
var hrtime = /* @__PURE__ */ Object.assign(/* @__PURE__ */ __name(function hrtime2(startTime) {
  const now = Date.now();
  const seconds = Math.trunc(now / 1e3);
  const nanos = now % 1e3 * 1e6;
  if (startTime) {
    let diffSeconds = seconds - startTime[0];
    let diffNanos = nanos - startTime[0];
    if (diffNanos < 0) {
      diffSeconds = diffSeconds - 1;
      diffNanos = 1e9 + diffNanos;
    }
    return [diffSeconds, diffNanos];
  }
  return [seconds, nanos];
}, "hrtime"), { bigint: /* @__PURE__ */ __name(function bigint() {
  return BigInt(Date.now() * 1e6);
}, "bigint") });

// node_modules/unenv/dist/runtime/node/internal/process/process.mjs
import { EventEmitter } from "node:events";

// node_modules/unenv/dist/runtime/node/internal/tty/read-stream.mjs
var ReadStream = class {
  static {
    __name(this, "ReadStream");
  }
  fd;
  isRaw = false;
  isTTY = false;
  constructor(fd) {
    this.fd = fd;
  }
  setRawMode(mode) {
    this.isRaw = mode;
    return this;
  }
};

// node_modules/unenv/dist/runtime/node/internal/tty/write-stream.mjs
var WriteStream = class {
  static {
    __name(this, "WriteStream");
  }
  fd;
  columns = 80;
  rows = 24;
  isTTY = false;
  constructor(fd) {
    this.fd = fd;
  }
  clearLine(dir3, callback) {
    callback && callback();
    return false;
  }
  clearScreenDown(callback) {
    callback && callback();
    return false;
  }
  cursorTo(x, y, callback) {
    callback && typeof callback === "function" && callback();
    return false;
  }
  moveCursor(dx, dy, callback) {
    callback && callback();
    return false;
  }
  getColorDepth(env2) {
    return 1;
  }
  hasColors(count3, env2) {
    return false;
  }
  getWindowSize() {
    return [this.columns, this.rows];
  }
  write(str, encoding, cb) {
    if (str instanceof Uint8Array) {
      str = new TextDecoder().decode(str);
    }
    try {
      console.log(str);
    } catch {
    }
    cb && typeof cb === "function" && cb();
    return false;
  }
};

// node_modules/unenv/dist/runtime/node/internal/process/node-version.mjs
var NODE_VERSION = "22.14.0";

// node_modules/unenv/dist/runtime/node/internal/process/process.mjs
var Process = class _Process extends EventEmitter {
  static {
    __name(this, "Process");
  }
  env;
  hrtime;
  nextTick;
  constructor(impl) {
    super();
    this.env = impl.env;
    this.hrtime = impl.hrtime;
    this.nextTick = impl.nextTick;
    for (const prop of [...Object.getOwnPropertyNames(_Process.prototype), ...Object.getOwnPropertyNames(EventEmitter.prototype)]) {
      const value = this[prop];
      if (typeof value === "function") {
        this[prop] = value.bind(this);
      }
    }
  }
  // --- event emitter ---
  emitWarning(warning, type, code) {
    console.warn(`${code ? `[${code}] ` : ""}${type ? `${type}: ` : ""}${warning}`);
  }
  emit(...args) {
    return super.emit(...args);
  }
  listeners(eventName) {
    return super.listeners(eventName);
  }
  // --- stdio (lazy initializers) ---
  #stdin;
  #stdout;
  #stderr;
  get stdin() {
    return this.#stdin ??= new ReadStream(0);
  }
  get stdout() {
    return this.#stdout ??= new WriteStream(1);
  }
  get stderr() {
    return this.#stderr ??= new WriteStream(2);
  }
  // --- cwd ---
  #cwd = "/";
  chdir(cwd2) {
    this.#cwd = cwd2;
  }
  cwd() {
    return this.#cwd;
  }
  // --- dummy props and getters ---
  arch = "";
  platform = "";
  argv = [];
  argv0 = "";
  execArgv = [];
  execPath = "";
  title = "";
  pid = 200;
  ppid = 100;
  get version() {
    return `v${NODE_VERSION}`;
  }
  get versions() {
    return { node: NODE_VERSION };
  }
  get allowedNodeEnvironmentFlags() {
    return /* @__PURE__ */ new Set();
  }
  get sourceMapsEnabled() {
    return false;
  }
  get debugPort() {
    return 0;
  }
  get throwDeprecation() {
    return false;
  }
  get traceDeprecation() {
    return false;
  }
  get features() {
    return {};
  }
  get release() {
    return {};
  }
  get connected() {
    return false;
  }
  get config() {
    return {};
  }
  get moduleLoadList() {
    return [];
  }
  constrainedMemory() {
    return 0;
  }
  availableMemory() {
    return 0;
  }
  uptime() {
    return 0;
  }
  resourceUsage() {
    return {};
  }
  // --- noop methods ---
  ref() {
  }
  unref() {
  }
  // --- unimplemented methods ---
  umask() {
    throw createNotImplementedError("process.umask");
  }
  getBuiltinModule() {
    return void 0;
  }
  getActiveResourcesInfo() {
    throw createNotImplementedError("process.getActiveResourcesInfo");
  }
  exit() {
    throw createNotImplementedError("process.exit");
  }
  reallyExit() {
    throw createNotImplementedError("process.reallyExit");
  }
  kill() {
    throw createNotImplementedError("process.kill");
  }
  abort() {
    throw createNotImplementedError("process.abort");
  }
  dlopen() {
    throw createNotImplementedError("process.dlopen");
  }
  setSourceMapsEnabled() {
    throw createNotImplementedError("process.setSourceMapsEnabled");
  }
  loadEnvFile() {
    throw createNotImplementedError("process.loadEnvFile");
  }
  disconnect() {
    throw createNotImplementedError("process.disconnect");
  }
  cpuUsage() {
    throw createNotImplementedError("process.cpuUsage");
  }
  setUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.setUncaughtExceptionCaptureCallback");
  }
  hasUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.hasUncaughtExceptionCaptureCallback");
  }
  initgroups() {
    throw createNotImplementedError("process.initgroups");
  }
  openStdin() {
    throw createNotImplementedError("process.openStdin");
  }
  assert() {
    throw createNotImplementedError("process.assert");
  }
  binding() {
    throw createNotImplementedError("process.binding");
  }
  // --- attached interfaces ---
  permission = { has: /* @__PURE__ */ notImplemented("process.permission.has") };
  report = {
    directory: "",
    filename: "",
    signal: "SIGUSR2",
    compact: false,
    reportOnFatalError: false,
    reportOnSignal: false,
    reportOnUncaughtException: false,
    getReport: /* @__PURE__ */ notImplemented("process.report.getReport"),
    writeReport: /* @__PURE__ */ notImplemented("process.report.writeReport")
  };
  finalization = {
    register: /* @__PURE__ */ notImplemented("process.finalization.register"),
    unregister: /* @__PURE__ */ notImplemented("process.finalization.unregister"),
    registerBeforeExit: /* @__PURE__ */ notImplemented("process.finalization.registerBeforeExit")
  };
  memoryUsage = Object.assign(() => ({
    arrayBuffers: 0,
    rss: 0,
    external: 0,
    heapTotal: 0,
    heapUsed: 0
  }), { rss: /* @__PURE__ */ __name(() => 0, "rss") });
  // --- undefined props ---
  mainModule = void 0;
  domain = void 0;
  // optional
  send = void 0;
  exitCode = void 0;
  channel = void 0;
  getegid = void 0;
  geteuid = void 0;
  getgid = void 0;
  getgroups = void 0;
  getuid = void 0;
  setegid = void 0;
  seteuid = void 0;
  setgid = void 0;
  setgroups = void 0;
  setuid = void 0;
  // internals
  _events = void 0;
  _eventsCount = void 0;
  _exiting = void 0;
  _maxListeners = void 0;
  _debugEnd = void 0;
  _debugProcess = void 0;
  _fatalException = void 0;
  _getActiveHandles = void 0;
  _getActiveRequests = void 0;
  _kill = void 0;
  _preload_modules = void 0;
  _rawDebug = void 0;
  _startProfilerIdleNotifier = void 0;
  _stopProfilerIdleNotifier = void 0;
  _tickCallback = void 0;
  _disconnect = void 0;
  _handleQueue = void 0;
  _pendingMessage = void 0;
  _channel = void 0;
  _send = void 0;
  _linkedBinding = void 0;
};

// node_modules/@cloudflare/unenv-preset/dist/runtime/node/process.mjs
var globalProcess = globalThis["process"];
var getBuiltinModule = globalProcess.getBuiltinModule;
var workerdProcess = getBuiltinModule("node:process");
var unenvProcess = new Process({
  env: globalProcess.env,
  hrtime,
  // `nextTick` is available from workerd process v1
  nextTick: workerdProcess.nextTick
});
var { exit, features, platform } = workerdProcess;
var {
  _channel,
  _debugEnd,
  _debugProcess,
  _disconnect,
  _events,
  _eventsCount,
  _exiting,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _handleQueue,
  _kill,
  _linkedBinding,
  _maxListeners,
  _pendingMessage,
  _preload_modules,
  _rawDebug,
  _send,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  arch,
  argv,
  argv0,
  assert: assert2,
  availableMemory,
  binding,
  channel,
  chdir,
  config,
  connected,
  constrainedMemory,
  cpuUsage,
  cwd,
  debugPort,
  disconnect,
  dlopen,
  domain,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  exitCode,
  finalization,
  getActiveResourcesInfo,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getMaxListeners,
  getuid,
  hasUncaughtExceptionCaptureCallback,
  hrtime: hrtime3,
  initgroups,
  kill,
  listenerCount,
  listeners,
  loadEnvFile,
  mainModule,
  memoryUsage,
  moduleLoadList,
  nextTick,
  off,
  on,
  once,
  openStdin,
  permission,
  pid,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  reallyExit,
  ref,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  send,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setMaxListeners,
  setSourceMapsEnabled,
  setuid,
  setUncaughtExceptionCaptureCallback,
  sourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  throwDeprecation,
  title,
  traceDeprecation,
  umask,
  unref,
  uptime,
  version,
  versions
} = unenvProcess;
var _process = {
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  hasUncaughtExceptionCaptureCallback,
  setUncaughtExceptionCaptureCallback,
  loadEnvFile,
  sourceMapsEnabled,
  arch,
  argv,
  argv0,
  chdir,
  config,
  connected,
  constrainedMemory,
  availableMemory,
  cpuUsage,
  cwd,
  debugPort,
  dlopen,
  disconnect,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  exit,
  finalization,
  features,
  getBuiltinModule,
  getActiveResourcesInfo,
  getMaxListeners,
  hrtime: hrtime3,
  kill,
  listeners,
  listenerCount,
  memoryUsage,
  nextTick,
  on,
  off,
  once,
  pid,
  platform,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  setMaxListeners,
  setSourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  title,
  throwDeprecation,
  traceDeprecation,
  umask,
  uptime,
  version,
  versions,
  // @ts-expect-error old API
  domain,
  initgroups,
  moduleLoadList,
  reallyExit,
  openStdin,
  assert: assert2,
  binding,
  send,
  exitCode,
  channel,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getuid,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setuid,
  permission,
  mainModule,
  _events,
  _eventsCount,
  _exiting,
  _maxListeners,
  _debugEnd,
  _debugProcess,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _kill,
  _preload_modules,
  _rawDebug,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  _disconnect,
  _handleQueue,
  _pendingMessage,
  _channel,
  _send,
  _linkedBinding
};
var process_default = _process;

// node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-process
globalThis.process = process_default;

// src/openapi-mcp-server/openapi/parser.ts
var OpenAPIToMCPConverter = class {
  constructor(openApiSpec) {
    this.openApiSpec = openApiSpec;
    this.schemaCache = {};
    this.nameCounter = 0;
  }
  static {
    __name(this, "OpenAPIToMCPConverter");
  }
  /**
   * Resolve a $ref reference to its schema in the openApiSpec.
   * Returns the raw OpenAPI SchemaObject or null if not found.
   */
  internalResolveRef(ref2, resolvedRefs) {
    if (!ref2.startsWith("#/")) {
      return null;
    }
    if (resolvedRefs.has(ref2)) {
      return null;
    }
    const parts = ref2.replace(/^#\//, "").split("/");
    let current = this.openApiSpec;
    for (const part of parts) {
      current = current[part];
      if (!current) return null;
    }
    resolvedRefs.add(ref2);
    return current;
  }
  /**
   * Convert an OpenAPI schema (or reference) into a JSON Schema object.
   * Uses caching and handles cycles by returning $ref nodes.
   */
  convertOpenApiSchemaToJsonSchema(schema, resolvedRefs, resolveRefs = false) {
    if ("$ref" in schema) {
      const ref2 = schema.$ref;
      if (!resolveRefs) {
        if (ref2.startsWith("#/components/schemas/")) {
          return {
            $ref: ref2.replace(/^#\/components\/schemas\//, "#/$defs/"),
            ..."description" in schema ? { description: schema.description } : {}
          };
        }
        console.error(`Attempting to resolve ref ${ref2} not found in components collection.`);
      }
      const refSchema = { $ref: ref2 };
      if ("description" in schema && schema.description) {
        refSchema.description = schema.description;
      }
      if (this.schemaCache[ref2]) {
        return this.schemaCache[ref2];
      }
      const resolved = this.internalResolveRef(ref2, resolvedRefs);
      if (!resolved) {
        console.error(`Failed to resolve ref ${ref2}`);
        return {
          $ref: ref2.replace(/^#\/components\/schemas\//, "#/$defs/"),
          description: "description" in schema ? schema.description ?? "" : ""
        };
      } else {
        const converted = this.convertOpenApiSchemaToJsonSchema(resolved, resolvedRefs, resolveRefs);
        this.schemaCache[ref2] = converted;
        return converted;
      }
    }
    const result = {};
    if (schema.type) {
      result.type = schema.type;
    }
    if (schema.format === "binary") {
      result.format = "uri-reference";
      const binaryDesc = "absolute paths to local files";
      result.description = schema.description ? `${schema.description} (${binaryDesc})` : binaryDesc;
    } else {
      if (schema.format) {
        result.format = schema.format;
      }
      if (schema.description) {
        result.description = schema.description;
      }
    }
    if (schema.enum) {
      result.enum = schema.enum;
    }
    if ("const" in schema && schema.const !== void 0) {
      result.const = schema.const;
    }
    if (schema.default !== void 0) {
      result.default = schema.default;
    }
    if (schema.type === "object") {
      result.type = "object";
      if (schema.properties) {
        result.properties = {};
        for (const [name, propSchema] of Object.entries(schema.properties)) {
          result.properties[name] = this.convertOpenApiSchemaToJsonSchema(propSchema, resolvedRefs, resolveRefs);
        }
      }
      if (schema.required) {
        result.required = schema.required;
      }
      if (schema.additionalProperties === true || schema.additionalProperties === void 0) {
        result.additionalProperties = true;
      } else if (schema.additionalProperties && typeof schema.additionalProperties === "object") {
        result.additionalProperties = this.convertOpenApiSchemaToJsonSchema(schema.additionalProperties, resolvedRefs, resolveRefs);
      } else {
        result.additionalProperties = false;
      }
    }
    if (schema.type === "array" && schema.items) {
      result.type = "array";
      result.items = this.convertOpenApiSchemaToJsonSchema(schema.items, resolvedRefs, resolveRefs);
    }
    if (schema.oneOf) {
      result.oneOf = schema.oneOf.map((s) => this.convertOpenApiSchemaToJsonSchema(s, resolvedRefs, resolveRefs));
    }
    if (schema.anyOf) {
      result.anyOf = schema.anyOf.map((s) => this.convertOpenApiSchemaToJsonSchema(s, resolvedRefs, resolveRefs));
    }
    if (schema.allOf) {
      result.allOf = schema.allOf.map((s) => this.convertOpenApiSchemaToJsonSchema(s, resolvedRefs, resolveRefs));
    }
    return result;
  }
  convertToMCPTools() {
    const apiName = "API";
    const openApiLookup = {};
    const tools = {
      [apiName]: { methods: [] }
    };
    const zip = {};
    for (const [path, pathItem] of Object.entries(this.openApiSpec.paths || {})) {
      if (!pathItem) continue;
      for (const [method, operation] of Object.entries(pathItem)) {
        if (!this.isOperation(method, operation)) continue;
        const mcpMethod = this.convertOperationToMCPMethod(operation, method, path);
        if (mcpMethod) {
          const uniqueName = this.ensureUniqueName(mcpMethod.name);
          mcpMethod.name = uniqueName;
          mcpMethod.description = this.getDescription(mcpMethod.description);
          tools[apiName].methods.push(mcpMethod);
          openApiLookup[apiName + "-" + uniqueName] = { ...operation, method, path };
          zip[apiName + "-" + uniqueName] = { openApi: { ...operation, method, path }, mcp: mcpMethod };
        }
      }
    }
    return { tools, openApiLookup, zip };
  }
  /**
   * Convert the OpenAPI spec to OpenAI's ChatCompletionTool format
   */
  convertToOpenAITools() {
    const tools = [];
    for (const [path, pathItem] of Object.entries(this.openApiSpec.paths || {})) {
      if (!pathItem) continue;
      for (const [method, operation] of Object.entries(pathItem)) {
        if (!this.isOperation(method, operation)) continue;
        const parameters = this.convertOperationToJsonSchema(operation, method, path);
        const tool = {
          type: "function",
          function: {
            name: operation.operationId,
            description: this.getDescription(operation.summary || operation.description || ""),
            parameters
          }
        };
        tools.push(tool);
      }
    }
    return tools;
  }
  /**
   * Convert the OpenAPI spec to Anthropic's Tool format
   */
  convertToAnthropicTools() {
    const tools = [];
    for (const [path, pathItem] of Object.entries(this.openApiSpec.paths || {})) {
      if (!pathItem) continue;
      for (const [method, operation] of Object.entries(pathItem)) {
        if (!this.isOperation(method, operation)) continue;
        const parameters = this.convertOperationToJsonSchema(operation, method, path);
        const tool = {
          name: operation.operationId,
          description: this.getDescription(operation.summary || operation.description || ""),
          input_schema: parameters
        };
        tools.push(tool);
      }
    }
    return tools;
  }
  convertComponentsToJsonSchema() {
    const components = this.openApiSpec.components || {};
    const schema = {};
    for (const [key, value] of Object.entries(components.schemas || {})) {
      schema[key] = this.convertOpenApiSchemaToJsonSchema(value, /* @__PURE__ */ new Set());
    }
    return schema;
  }
  /**
   * Helper method to convert an operation to a JSON Schema for parameters
   */
  convertOperationToJsonSchema(operation, method, path) {
    const schema = {
      type: "object",
      properties: {},
      required: [],
      $defs: this.convertComponentsToJsonSchema()
    };
    if (operation.parameters) {
      for (const param of operation.parameters) {
        const paramObj = this.resolveParameter(param);
        if (paramObj && paramObj.schema) {
          const paramSchema = this.convertOpenApiSchemaToJsonSchema(paramObj.schema, /* @__PURE__ */ new Set());
          if (paramObj.description) {
            paramSchema.description = paramObj.description;
          }
          schema.properties[paramObj.name] = paramSchema;
          if (paramObj.required) {
            schema.required.push(paramObj.name);
          }
        }
      }
    }
    if (operation.requestBody) {
      const bodyObj = this.resolveRequestBody(operation.requestBody);
      if (bodyObj?.content) {
        if (bodyObj.content["application/json"]?.schema) {
          const bodySchema = this.convertOpenApiSchemaToJsonSchema(bodyObj.content["application/json"].schema, /* @__PURE__ */ new Set());
          if (bodySchema.type === "object" && bodySchema.properties) {
            for (const [name, propSchema] of Object.entries(bodySchema.properties)) {
              schema.properties[name] = propSchema;
            }
            if (bodySchema.required) {
              schema.required.push(...bodySchema.required);
            }
          }
        }
      }
    }
    return schema;
  }
  isOperation(method, operation) {
    return ["get", "post", "put", "delete", "patch"].includes(method.toLowerCase());
  }
  isParameterObject(param) {
    return !("$ref" in param);
  }
  isRequestBodyObject(body) {
    return !("$ref" in body);
  }
  resolveParameter(param) {
    if (this.isParameterObject(param)) {
      return param;
    } else {
      const resolved = this.internalResolveRef(param.$ref, /* @__PURE__ */ new Set());
      if (resolved && resolved.name) {
        return resolved;
      }
    }
    return null;
  }
  resolveRequestBody(body) {
    if (this.isRequestBodyObject(body)) {
      return body;
    } else {
      const resolved = this.internalResolveRef(body.$ref, /* @__PURE__ */ new Set());
      if (resolved) {
        return resolved;
      }
    }
    return null;
  }
  resolveResponse(response) {
    if ("$ref" in response) {
      const resolved = this.internalResolveRef(response.$ref, /* @__PURE__ */ new Set());
      if (resolved) {
        return resolved;
      } else {
        return null;
      }
    }
    return response;
  }
  convertOperationToMCPMethod(operation, method, path) {
    if (!operation.operationId) {
      console.warn(`Operation without operationId at ${method} ${path}`);
      return null;
    }
    const methodName = operation.operationId;
    const inputSchema = {
      $defs: this.convertComponentsToJsonSchema(),
      type: "object",
      properties: {},
      required: []
    };
    if (operation.parameters) {
      for (const param of operation.parameters) {
        const paramObj = this.resolveParameter(param);
        if (paramObj && paramObj.schema) {
          const schema = this.convertOpenApiSchemaToJsonSchema(paramObj.schema, /* @__PURE__ */ new Set(), false);
          if (paramObj.description) {
            schema.description = paramObj.description;
          }
          inputSchema.properties[paramObj.name] = schema;
          if (paramObj.required) {
            inputSchema.required.push(paramObj.name);
          }
        }
      }
    }
    if (operation.requestBody) {
      const bodyObj = this.resolveRequestBody(operation.requestBody);
      if (bodyObj?.content) {
        if (bodyObj.content["multipart/form-data"]?.schema) {
          const formSchema = this.convertOpenApiSchemaToJsonSchema(bodyObj.content["multipart/form-data"].schema, /* @__PURE__ */ new Set(), false);
          if (formSchema.type === "object" && formSchema.properties) {
            for (const [name, propSchema] of Object.entries(formSchema.properties)) {
              inputSchema.properties[name] = propSchema;
            }
            if (formSchema.required) {
              inputSchema.required.push(...formSchema.required);
            }
          }
        } else if (bodyObj.content["application/json"]?.schema) {
          const bodySchema = this.convertOpenApiSchemaToJsonSchema(bodyObj.content["application/json"].schema, /* @__PURE__ */ new Set(), false);
          if (bodySchema.type === "object" && bodySchema.properties) {
            for (const [name, propSchema] of Object.entries(bodySchema.properties)) {
              inputSchema.properties[name] = propSchema;
            }
            if (bodySchema.required) {
              inputSchema.required.push(...bodySchema.required);
            }
          } else {
            inputSchema.properties["body"] = bodySchema;
            inputSchema.required.push("body");
          }
        }
      }
    }
    let description = operation.summary || operation.description || "";
    if (operation.responses) {
      const errorResponses = Object.entries(operation.responses).filter(([code]) => code.startsWith("4") || code.startsWith("5")).map(([code, response]) => {
        const responseObj = this.resolveResponse(response);
        let errorDesc = responseObj?.description || "";
        return `${code}: ${errorDesc}`;
      });
      if (errorResponses.length > 0) {
        description += "\nError Responses:\n" + errorResponses.join("\n");
      }
    }
    const returnSchema = this.extractResponseType(operation.responses);
    try {
      return {
        name: methodName,
        description,
        inputSchema,
        ...returnSchema ? { returnSchema } : {}
      };
    } catch (error3) {
      console.warn(`Failed to generate Zod schema for ${methodName}:`, error3);
      return {
        name: methodName,
        description,
        inputSchema,
        ...returnSchema ? { returnSchema } : {}
      };
    }
  }
  extractResponseType(responses) {
    const successResponse = responses?.["200"] || responses?.["201"] || responses?.["202"] || responses?.["204"];
    if (!successResponse) return null;
    const responseObj = this.resolveResponse(successResponse);
    if (!responseObj || !responseObj.content) return null;
    if (responseObj.content["application/json"]?.schema) {
      const returnSchema = this.convertOpenApiSchemaToJsonSchema(responseObj.content["application/json"].schema, /* @__PURE__ */ new Set(), false);
      returnSchema["$defs"] = this.convertComponentsToJsonSchema();
      if (responseObj.description && !returnSchema.description) {
        returnSchema.description = responseObj.description;
      }
      return returnSchema;
    }
    if (responseObj.content["image/png"] || responseObj.content["image/jpeg"]) {
      return { type: "string", format: "binary", description: responseObj.description || "" };
    }
    return { type: "string", description: responseObj.description || "" };
  }
  ensureUniqueName(name) {
    if (name.length <= 64) {
      return name;
    }
    const truncatedName = name.slice(0, 64 - 5);
    const uniqueSuffix = this.generateUniqueSuffix();
    return `${truncatedName}-${uniqueSuffix}`;
  }
  generateUniqueSuffix() {
    this.nameCounter += 1;
    return this.nameCounter.toString().padStart(4, "0");
  }
  getDescription(description) {
    if (this.openApiSpec.info.title === "Notion API") {
      return "Notion | " + description;
    }
    return description;
  }
};

// src/custom-tools/get-media.ts
function createGetMediaTool(notionHeaders) {
  return {
    tool: {
      name: "get-media",
      description: "Download an image or file from a Notion block and return it as base64. Use this to view images attached to Notion pages. Provide either a block_id (for a specific image block) or a page_id (to get the first image found on the page).",
      inputSchema: {
        type: "object",
        properties: {
          block_id: {
            type: "string",
            description: "The ID of a specific image/file block to download from"
          },
          page_id: {
            type: "string",
            description: "The ID of a page to scan for the first image block"
          }
        }
      },
      annotations: {
        title: "Get Media",
        readOnlyHint: true
      }
    },
    handler: /* @__PURE__ */ __name(async (params) => {
      const blockId = params.block_id;
      const pageId = params.page_id;
      if (!blockId && !pageId) {
        return {
          content: [{ type: "text", text: JSON.stringify({ error: "Provide either block_id or page_id" }) }]
        };
      }
      const baseUrl = "https://api.notion.com";
      try {
        let imageUrl = null;
        let mimeType = "image/png";
        if (blockId) {
          const blockRes = await fetch(`${baseUrl}/v1/blocks/${blockId}`, { headers: notionHeaders });
          if (!blockRes.ok) {
            return {
              content: [{ type: "text", text: JSON.stringify({ error: `Failed to fetch block: ${blockRes.status}` }) }]
            };
          }
          const block = await blockRes.json();
          imageUrl = extractImageUrl(block);
        } else if (pageId) {
          const childrenRes = await fetch(`${baseUrl}/v1/blocks/${pageId}/children?page_size=100`, { headers: notionHeaders });
          if (!childrenRes.ok) {
            return {
              content: [{ type: "text", text: JSON.stringify({ error: `Failed to fetch page blocks: ${childrenRes.status}` }) }]
            };
          }
          const children = await childrenRes.json();
          const results = children.results || [];
          for (const block of results) {
            imageUrl = extractImageUrl(block);
            if (imageUrl) break;
          }
        }
        if (!imageUrl) {
          return {
            content: [{ type: "text", text: JSON.stringify({ error: "No image found in the specified block or page" }) }]
          };
        }
        if (imageUrl.includes(".jpg") || imageUrl.includes(".jpeg")) mimeType = "image/jpeg";
        else if (imageUrl.includes(".gif")) mimeType = "image/gif";
        else if (imageUrl.includes(".webp")) mimeType = "image/webp";
        else if (imageUrl.includes(".svg")) mimeType = "image/svg+xml";
        else if (imageUrl.includes(".pdf")) mimeType = "application/pdf";
        const imageRes = await fetch(imageUrl);
        if (!imageRes.ok) {
          return {
            content: [{ type: "text", text: JSON.stringify({ error: `Failed to download image: ${imageRes.status}` }) }]
          };
        }
        const arrayBuffer = await imageRes.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString("base64");
        return {
          content: [{
            type: "image",
            data: base64,
            mimeType
          }]
        };
      } catch (error3) {
        return {
          content: [{ type: "text", text: JSON.stringify({ error: `get-media failed: ${error3.message}` }) }]
        };
      }
    }, "handler")
  };
}
__name(createGetMediaTool, "createGetMediaTool");
function extractImageUrl(block) {
  const type = block.type;
  if (type === "image") {
    const image = block.image;
    if (image?.type === "file") return image.file?.url || null;
    if (image?.type === "external") return image.external?.url || null;
    if (image?.type === "file_upload") return image.file_upload?.url || null;
  }
  if (type === "file") {
    const file = block.file;
    if (file?.type === "file") return file.file?.url || null;
    if (file?.type === "external") return file.external?.url || null;
    if (file?.type === "file_upload") return file.file_upload?.url || null;
  }
  if (type === "pdf") {
    const pdf = block.pdf;
    if (pdf?.type === "file") return pdf.file?.url || null;
    if (pdf?.type === "external") return pdf.external?.url || null;
  }
  if (type === "video") {
    const video = block.video;
    if (video?.type === "file") return video.file?.url || null;
    if (video?.type === "external") return video.external?.url || null;
  }
  return null;
}
__name(extractImageUrl, "extractImageUrl");

// scripts/notion-openapi.json
var notion_openapi_default = {
  openapi: "3.1.0",
  info: {
    title: "Notion API",
    version: "2.0.0",
    description: "Notion API 2025-09-03 - Data Source Edition. Breaking change: Database endpoints replaced with data source endpoints.",
    license: {
      name: "MIT",
      url: "https://github.com/makenotion/notion-sdk-js/blob/main/LICENSE"
    }
  },
  servers: [
    {
      url: "https://api.notion.com"
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer"
      },
      basicAuth: {
        type: "http",
        scheme: "basic"
      }
    },
    parameters: {
      notionVersion: {
        name: "Notion-Version",
        in: "header",
        required: false,
        schema: {
          type: "string",
          default: "2025-09-03"
        },
        description: "The Notion API version"
      }
    },
    schemas: {
      richTextRequest: {
        type: "object",
        required: [
          "text"
        ],
        properties: {
          text: {
            type: "object",
            required: [
              "content"
            ],
            properties: {
              content: {
                type: "string"
              },
              link: {
                type: [
                  "object",
                  "null"
                ],
                properties: {
                  url: {
                    type: "string"
                  }
                },
                required: [
                  "url"
                ]
              }
            },
            additionalProperties: false
          },
          type: {
            enum: [
              "text"
            ],
            type: "string"
          }
        },
        additionalProperties: false
      },
      pageIdParentRequest: {
        type: "object",
        properties: {
          page_id: {
            type: "string",
            format: "uuid"
          }
        },
        required: [
          "page_id"
        ]
      },
      dataSourceIdParentRequest: {
        type: "object",
        properties: {
          type: {
            type: "string",
            const: "database_id"
          },
          database_id: {
            type: "string",
            format: "uuid"
          }
        },
        required: [
          "database_id"
        ]
      },
      parentRequest: {
        oneOf: [
          {
            $ref: "#/components/schemas/pageIdParentRequest"
          },
          {
            $ref: "#/components/schemas/dataSourceIdParentRequest"
          },
          {
            type: "object",
            properties: {
              type: {
                const: "workspace"
              }
            },
            required: [
              "type"
            ]
          }
        ]
      },
      movePageParentRequest: {
        oneOf: [
          {
            type: "object",
            properties: {
              type: {
                const: "page_id"
              },
              page_id: {
                type: "string",
                format: "uuid"
              }
            },
            required: [
              "type",
              "page_id"
            ]
          },
          {
            type: "object",
            properties: {
              type: {
                const: "database_id"
              },
              database_id: {
                type: "string",
                format: "uuid"
              }
            },
            required: [
              "type",
              "database_id"
            ]
          },
          {
            type: "object",
            properties: {
              type: {
                const: "workspace"
              }
            },
            required: [
              "type"
            ]
          }
        ]
      },
      sortObject: {
        type: "object",
        required: [
          "property",
          "direction"
        ],
        properties: {
          property: {
            type: "string"
          },
          direction: {
            enum: [
              "ascending",
              "descending"
            ],
            type: "string"
          }
        }
      },
      paragraphBlockRequest: {
        type: "object",
        properties: {
          paragraph: {
            type: "object",
            properties: {
              rich_text: {
                type: "array",
                items: {
                  $ref: "#/components/schemas/richTextRequest"
                },
                maxItems: 100
              }
            },
            additionalProperties: false,
            required: [
              "rich_text"
            ]
          },
          type: {
            enum: [
              "paragraph"
            ],
            type: "string"
          }
        },
        additionalProperties: false
      },
      bulletedListItemBlockRequest: {
        type: "object",
        properties: {
          bulleted_list_item: {
            type: "object",
            properties: {
              rich_text: {
                type: "array",
                items: {
                  $ref: "#/components/schemas/richTextRequest"
                },
                maxItems: 100
              }
            },
            additionalProperties: false,
            required: [
              "rich_text"
            ]
          },
          type: {
            enum: [
              "bulleted_list_item"
            ],
            type: "string"
          }
        },
        additionalProperties: false
      },
      blockObjectRequest: {
        anyOf: [
          {
            $ref: "#/components/schemas/paragraphBlockRequest"
          },
          {
            $ref: "#/components/schemas/bulletedListItemBlockRequest"
          }
        ]
      }
    }
  },
  security: [
    {
      bearerAuth: []
    }
  ],
  tags: [
    {
      name: "Databases",
      description: "Database endpoints for retrieving database metadata"
    },
    {
      name: "Data sources",
      description: "Data source endpoints for querying and managing databases"
    },
    {
      name: "Pages",
      description: "Page endpoints for creating and managing pages"
    },
    {
      name: "Blocks",
      description: "Block endpoints for managing page content"
    },
    {
      name: "Users",
      description: "User endpoints"
    },
    {
      name: "Search",
      description: "Search endpoints"
    },
    {
      name: "Comments",
      description: "Comment endpoints"
    }
  ],
  paths: {
    "/v1/users/{user_id}": {
      get: {
        summary: "Retrieve a user",
        description: "",
        operationId: "get-user",
        parameters: [
          {
            name: "user_id",
            in: "path",
            required: true,
            schema: {
              type: "string",
              format: "uuid"
            }
          },
          {
            $ref: "#/components/parameters/notionVersion"
          }
        ],
        responses: {
          "200": {
            description: "200",
            content: {
              "application/json": {
                examples: {}
              }
            }
          },
          "400": {
            description: "400",
            content: {
              "application/json": {
                examples: {
                  Result: {
                    value: {}
                  }
                },
                schema: {
                  type: "object",
                  properties: {}
                }
              }
            }
          }
        },
        deprecated: false,
        security: []
      }
    },
    "/v1/users": {
      get: {
        summary: "List all users",
        operationId: "get-users",
        parameters: [
          {
            name: "start_cursor",
            in: "query",
            description: "If supplied, this endpoint will return a page of results starting after the cursor provided. If not supplied, this endpoint will return the first page of results.",
            schema: {
              type: "string"
            }
          },
          {
            name: "page_size",
            in: "query",
            description: "The number of items from the full list desired in the response. Maximum: 100",
            schema: {
              type: "integer",
              default: 100
            }
          },
          {
            $ref: "#/components/parameters/notionVersion"
          }
        ],
        responses: {
          "400": {
            description: "400",
            content: {
              "application/json": {
                examples: {
                  Result: {
                    value: {}
                  }
                },
                schema: {
                  type: "object",
                  properties: {}
                }
              }
            }
          },
          "200": {
            description: "Successful response",
            content: {
              "application/json": {
                schema: {
                  type: "object"
                }
              }
            }
          }
        },
        deprecated: false
      }
    },
    "/v1/users/me": {
      get: {
        summary: "Retrieve your token's bot user",
        description: "",
        operationId: "get-self",
        parameters: [
          {
            $ref: "#/components/parameters/notionVersion"
          }
        ],
        responses: {
          "200": {
            description: "200",
            content: {
              "application/json": {
                examples: {
                  Result: {
                    value: {
                      object: "user",
                      id: "16d84278-ab0e-484c-9bdd-b35da3bd8905",
                      name: "pied piper",
                      avatar_url: null,
                      type: "bot",
                      bot: {
                        owner: {
                          type: "user",
                          user: {
                            object: "user",
                            id: "5389a034-eb5c-47b5-8a9e-f79c99ef166c",
                            name: "christine makenotion",
                            avatar_url: null,
                            type: "person",
                            person: {
                              email: "christine@makenotion.com"
                            }
                          }
                        }
                      }
                    }
                  }
                },
                schema: {
                  type: "object",
                  properties: {
                    object: {
                      type: "string",
                      example: "user"
                    },
                    id: {
                      type: "string",
                      example: "16d84278-ab0e-484c-9bdd-b35da3bd8905"
                    },
                    name: {
                      type: "string",
                      example: "pied piper"
                    },
                    avatar_url: {},
                    type: {
                      type: "string",
                      example: "bot"
                    },
                    bot: {
                      type: "object",
                      properties: {
                        owner: {
                          type: "object",
                          properties: {
                            type: {
                              type: "string",
                              example: "user"
                            },
                            user: {
                              type: "object",
                              properties: {
                                object: {
                                  type: "string",
                                  example: "user"
                                },
                                id: {
                                  type: "string",
                                  example: "5389a034-eb5c-47b5-8a9e-f79c99ef166c"
                                },
                                name: {
                                  type: "string",
                                  example: "christine makenotion"
                                },
                                avatar_url: {},
                                type: {
                                  type: "string",
                                  example: "person"
                                },
                                person: {
                                  type: "object",
                                  properties: {
                                    email: {
                                      type: "string",
                                      example: "christine@makenotion.com"
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "400": {
            description: "Bad request",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    object: {
                      type: "string",
                      example: "error"
                    },
                    status: {
                      type: "integer",
                      example: 400
                    },
                    code: {
                      type: "string"
                    },
                    message: {
                      type: "string"
                    }
                  }
                }
              }
            }
          }
        },
        deprecated: false,
        security: []
      }
    },
    "/v1/search": {
      post: {
        summary: "Search by title",
        description: "",
        operationId: "post-search",
        parameters: [
          {
            $ref: "#/components/parameters/notionVersion"
          }
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  query: {
                    type: "string",
                    description: "The text that the API compares page and database titles against."
                  },
                  sort: {
                    type: "object",
                    description: 'A set of criteria, `direction` and `timestamp` keys, that orders the results. The **only** supported timestamp value is `"last_edited_time"`. Supported `direction` values are `"ascending"` and `"descending"`. If `sort` is not provided, then the most recently edited results are returned first.',
                    properties: {
                      direction: {
                        type: "string",
                        description: "The direction to sort. Possible values include `ascending` and `descending`."
                      },
                      timestamp: {
                        type: "string",
                        description: "The name of the timestamp to sort against. Possible values include `last_edited_time`."
                      }
                    }
                  },
                  filter: {
                    type: "object",
                    description: 'A set of criteria, `value` and `property` keys, that limits the results to either only pages or only data sources. Possible `value` values are `"page"` or `"data_source"`. The only supported `property` value is `"object"`.',
                    properties: {
                      value: {
                        type: "string",
                        description: "The value of the property to filter the results by.  Possible values for object type include `page` or `data_source`.  **Limitation**: Currently the only filter allowed is `object` which will filter by type of object (either `page` or `data_source`)",
                        enum: [
                          "page",
                          "data_source"
                        ]
                      },
                      property: {
                        type: "string",
                        description: "The name of the property to filter by. Currently the only property you can filter by is the object type.  Possible values include `object`.   Limitation: Currently the only filter allowed is `object` which will filter by type of object (either `page` or `data_source`)"
                      }
                    }
                  },
                  start_cursor: {
                    type: "string",
                    description: "A `cursor` value returned in a previous response that If supplied, limits the response to results starting after the `cursor`. If not supplied, then the first page of results is returned. Refer to [pagination](https://developers.notion.com/reference/intro#pagination) for more details."
                  },
                  page_size: {
                    type: "integer",
                    description: "The number of items from the full list to include in the response. Maximum: `100`.",
                    default: 100,
                    format: "int32"
                  }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Successful response",
            content: {
              "application/json": {
                schema: {
                  type: "object"
                }
              }
            }
          },
          "400": {
            description: "Bad request",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    object: {
                      type: "string",
                      example: "error"
                    },
                    status: {
                      type: "integer",
                      example: 400
                    },
                    code: {
                      type: "string"
                    },
                    message: {
                      type: "string"
                    }
                  }
                }
              }
            }
          }
        },
        deprecated: false,
        security: []
      }
    },
    "/v1/blocks/{block_id}/children": {
      get: {
        summary: "Retrieve block children",
        description: "",
        operationId: "get-block-children",
        parameters: [
          {
            name: "block_id",
            in: "path",
            description: "Identifier for a [block](ref:block)",
            schema: {
              type: "string"
            },
            required: true
          },
          {
            name: "start_cursor",
            in: "query",
            description: "If supplied, this endpoint will return a page of results starting after the cursor provided. If not supplied, this endpoint will return the first page of results.",
            schema: {
              type: "string"
            }
          },
          {
            name: "page_size",
            in: "query",
            description: "The number of items from the full list desired in the response. Maximum: 100",
            schema: {
              type: "integer",
              format: "int32",
              default: 100
            }
          },
          {
            $ref: "#/components/parameters/notionVersion"
          }
        ],
        responses: {
          "200": {
            description: "Successful response",
            content: {
              "application/json": {
                schema: {
                  type: "object"
                }
              }
            }
          },
          "400": {
            description: "Bad request",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    object: {
                      type: "string",
                      example: "error"
                    },
                    status: {
                      type: "integer",
                      example: 400
                    },
                    code: {
                      type: "string"
                    },
                    message: {
                      type: "string"
                    }
                  }
                }
              }
            }
          }
        },
        deprecated: false,
        security: []
      },
      patch: {
        summary: "Append block children",
        description: "",
        operationId: "patch-block-children",
        parameters: [
          {
            name: "block_id",
            in: "path",
            description: "Identifier for a [block](ref:block). Also accepts a [page](ref:page) ID.",
            schema: {
              type: "string"
            },
            required: true
          },
          {
            $ref: "#/components/parameters/notionVersion"
          }
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: [
                  "children"
                ],
                properties: {
                  children: {
                    type: "array",
                    items: {
                      $ref: "#/components/schemas/blockObjectRequest"
                    },
                    description: "Child content to append to a container block as an array of [block objects](ref:block)"
                  },
                  after: {
                    type: "string",
                    description: "The ID of the existing block that the new block should be appended after."
                  }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Successful response",
            content: {
              "application/json": {
                schema: {
                  type: "object"
                }
              }
            }
          },
          "400": {
            description: "Bad request",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    object: {
                      type: "string",
                      example: "error"
                    },
                    status: {
                      type: "integer",
                      example: 400
                    },
                    code: {
                      type: "string"
                    },
                    message: {
                      type: "string"
                    }
                  }
                }
              }
            }
          }
        },
        deprecated: false,
        security: []
      }
    },
    "/v1/blocks/{block_id}": {
      get: {
        summary: "Retrieve a block",
        description: "",
        operationId: "retrieve-a-block",
        parameters: [
          {
            name: "block_id",
            in: "path",
            description: "Identifier for a Notion block",
            schema: {
              type: "string"
            },
            required: true
          },
          {
            $ref: "#/components/parameters/notionVersion"
          }
        ],
        responses: {
          "200": {
            description: "Successful response",
            content: {
              "application/json": {
                schema: {
                  type: "object"
                }
              }
            }
          },
          "400": {
            description: "Bad request",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    object: {
                      type: "string",
                      example: "error"
                    },
                    status: {
                      type: "integer",
                      example: 400
                    },
                    code: {
                      type: "string"
                    },
                    message: {
                      type: "string"
                    }
                  }
                }
              }
            }
          }
        },
        deprecated: false,
        security: []
      },
      patch: {
        summary: "Update a block",
        description: "",
        operationId: "update-a-block",
        parameters: [
          {
            name: "block_id",
            in: "path",
            description: "Identifier for a Notion block",
            schema: {
              type: "string"
            },
            required: true
          },
          {
            $ref: "#/components/parameters/notionVersion"
          }
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  type: {
                    type: "object",
                    description: "The [block object `type`](ref:block#block-object-keys) value with the properties to be updated. Currently only `text` (for supported block types) and `checked` (for `to_do` blocks) fields can be updated.",
                    properties: {}
                  },
                  archived: {
                    type: "boolean",
                    description: "Set to true to archive (delete) a block. Set to false to un-archive (restore) a block.",
                    default: true
                  }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Successful response",
            content: {
              "application/json": {
                schema: {
                  type: "object"
                }
              }
            }
          },
          "400": {
            description: "Bad request",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    object: {
                      type: "string",
                      example: "error"
                    },
                    status: {
                      type: "integer",
                      example: 400
                    },
                    code: {
                      type: "string"
                    },
                    message: {
                      type: "string"
                    }
                  }
                }
              }
            }
          }
        },
        deprecated: false,
        security: []
      },
      delete: {
        summary: "Delete a block",
        description: "",
        operationId: "delete-a-block",
        parameters: [
          {
            name: "block_id",
            in: "path",
            description: "Identifier for a Notion block",
            schema: {
              type: "string"
            },
            required: true
          },
          {
            $ref: "#/components/parameters/notionVersion"
          }
        ],
        responses: {
          "200": {
            description: "Successful response",
            content: {
              "application/json": {
                schema: {
                  type: "object"
                }
              }
            }
          },
          "400": {
            description: "Bad request",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    object: {
                      type: "string",
                      example: "error"
                    },
                    status: {
                      type: "integer",
                      example: 400
                    },
                    code: {
                      type: "string"
                    },
                    message: {
                      type: "string"
                    }
                  }
                }
              }
            }
          }
        },
        deprecated: false,
        security: []
      }
    },
    "/v1/pages/{page_id}": {
      get: {
        summary: "Retrieve a page",
        description: "",
        operationId: "retrieve-a-page",
        parameters: [
          {
            name: "page_id",
            in: "path",
            description: "Identifier for a Notion page",
            schema: {
              type: "string"
            },
            required: true
          },
          {
            name: "filter_properties",
            in: "query",
            description: "A list of page property value IDs associated with the page. Use this param to limit the response to a specific page property value or values. To retrieve multiple properties, specify each page property ID. For example: `?filter_properties=iAk8&filter_properties=b7dh`.",
            schema: {
              type: "string"
            }
          },
          {
            $ref: "#/components/parameters/notionVersion"
          }
        ],
        responses: {
          "200": {
            description: "Successful response",
            content: {
              "application/json": {
                schema: {
                  type: "object"
                }
              }
            }
          },
          "400": {
            description: "Bad request",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    object: {
                      type: "string",
                      example: "error"
                    },
                    status: {
                      type: "integer",
                      example: 400
                    },
                    code: {
                      type: "string"
                    },
                    message: {
                      type: "string"
                    }
                  }
                }
              }
            }
          }
        },
        deprecated: false,
        security: []
      },
      patch: {
        summary: "Update page properties",
        description: "",
        operationId: "patch-page",
        parameters: [
          {
            name: "page_id",
            in: "path",
            description: "The identifier for the Notion page to be updated.",
            schema: {
              type: "string"
            },
            required: true
          },
          {
            $ref: "#/components/parameters/notionVersion"
          }
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  properties: {
                    description: "The property values to update for the page. The keys are the names or IDs of the property and the values are property values. If a page property ID is not included, then it is not changed.",
                    type: "object",
                    additionalProperties: true
                  },
                  in_trash: {
                    type: "boolean",
                    description: "Set to true to delete a block. Set to false to restore a block.",
                    default: false
                  },
                  archived: {
                    type: "boolean"
                  },
                  icon: {
                    description: "A page icon for the page. Supported types are [external file object](https://developers.notion.com/reference/file-object) or [emoji object](https://developers.notion.com/reference/emoji-object).",
                    type: "object",
                    properties: {
                      emoji: {
                        type: "string"
                      }
                    },
                    additionalProperties: false,
                    required: [
                      "emoji"
                    ]
                  },
                  cover: {
                    type: "object",
                    description: "A cover image for the page. Only [external file objects](https://developers.notion.com/reference/file-object) are supported.",
                    properties: {
                      external: {
                        type: "object",
                        properties: {
                          url: {
                            type: "string"
                          }
                        },
                        additionalProperties: false,
                        required: [
                          "url"
                        ]
                      },
                      type: {
                        enum: [
                          "external"
                        ],
                        type: "string"
                      }
                    },
                    required: [
                      "external"
                    ],
                    additionalProperties: false
                  }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Successful response",
            content: {
              "application/json": {
                schema: {
                  type: "object"
                }
              }
            }
          },
          "400": {
            description: "Bad request",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    object: {
                      type: "string",
                      example: "error"
                    },
                    status: {
                      type: "integer",
                      example: 400
                    },
                    code: {
                      type: "string"
                    },
                    message: {
                      type: "string"
                    }
                  }
                }
              }
            }
          }
        },
        deprecated: false,
        security: []
      }
    },
    "/v1/pages": {
      post: {
        summary: "Create a page",
        description: "",
        operationId: "post-page",
        parameters: [
          {
            $ref: "#/components/parameters/notionVersion"
          }
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: [
                  "parent",
                  "properties"
                ],
                properties: {
                  parent: {
                    $ref: "#/components/schemas/parentRequest"
                  },
                  properties: {
                    description: "The property values for the new page. The keys are the names or IDs of the property and the values are property values.",
                    type: "object",
                    additionalProperties: true
                  },
                  children: {
                    type: "array",
                    description: "The content to be rendered on the new page, represented as an array of [block objects](https://developers.notion.com/reference/block).",
                    items: {
                      type: "string"
                    }
                  },
                  icon: {
                    type: "string",
                    description: "The icon of the new page. Either an [emoji object](https://developers.notion.com/reference/emoji-object) or an [external file object](https://developers.notion.com/reference/file-object)..",
                    format: "json"
                  },
                  cover: {
                    type: "string",
                    description: "The cover image of the new page, represented as a [file object](https://developers.notion.com/reference/file-object).",
                    format: "json"
                  }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Successful response",
            content: {
              "application/json": {
                schema: {
                  type: "object"
                }
              }
            }
          },
          "400": {
            description: "Bad request",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    object: {
                      type: "string",
                      example: "error"
                    },
                    status: {
                      type: "integer",
                      example: 400
                    },
                    code: {
                      type: "string"
                    },
                    message: {
                      type: "string"
                    }
                  }
                }
              }
            }
          }
        },
        deprecated: false,
        security: []
      }
    },
    "/v1/pages/{page_id}/properties/{property_id}": {
      get: {
        summary: "Retrieve a page property item",
        description: "",
        operationId: "retrieve-a-page-property",
        parameters: [
          {
            name: "page_id",
            in: "path",
            description: "Identifier for a Notion page",
            schema: {
              type: "string"
            },
            required: true
          },
          {
            name: "property_id",
            in: "path",
            description: "Identifier for a page [property](https://developers.notion.com/reference/page#all-property-values)",
            schema: {
              type: "string"
            },
            required: true
          },
          {
            name: "page_size",
            in: "query",
            description: "For paginated properties. The max number of property item objects on a page. The default size is 100",
            schema: {
              type: "integer",
              format: "int32"
            }
          },
          {
            name: "start_cursor",
            in: "query",
            description: "For paginated properties.",
            schema: {
              type: "string"
            }
          },
          {
            $ref: "#/components/parameters/notionVersion"
          }
        ],
        responses: {
          "200": {
            description: "200",
            content: {
              "application/json": {
                examples: {}
              }
            }
          },
          "400": {
            description: "Bad request",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    object: {
                      type: "string",
                      example: "error"
                    },
                    status: {
                      type: "integer",
                      example: 400
                    },
                    code: {
                      type: "string"
                    },
                    message: {
                      type: "string"
                    }
                  }
                }
              }
            }
          }
        },
        deprecated: false,
        security: []
      }
    },
    "/v1/comments": {
      get: {
        summary: "Retrieve comments",
        description: "Retrieves a list of un-resolved [Comment objects](ref:comment-object) from a page or block.",
        operationId: "retrieve-a-comment",
        parameters: [
          {
            name: "block_id",
            in: "query",
            description: "Identifier for a Notion block or page",
            required: true,
            schema: {
              type: "string"
            }
          },
          {
            name: "start_cursor",
            in: "query",
            description: "If supplied, this endpoint will return a page of results starting after the cursor provided. If not supplied, this endpoint will return the first page of results.",
            schema: {
              type: "string"
            }
          },
          {
            name: "page_size",
            in: "query",
            description: "The number of items from the full list desired in the response. Maximum: 100",
            schema: {
              type: "integer",
              format: "int32"
            }
          },
          {
            $ref: "#/components/parameters/notionVersion"
          }
        ],
        responses: {
          "200": {
            description: "200",
            content: {
              "application/json": {
                examples: {
                  OK: {
                    value: {
                      object: "list",
                      results: [
                        {
                          object: "comment",
                          id: "94cc56ab-9f02-409d-9f99-1037e9fe502f",
                          parent: {
                            type: "page_id",
                            page_id: "5c6a2821-6bb1-4a7e-b6e1-c50111515c3d"
                          },
                          discussion_id: "f1407351-36f5-4c49-a13c-49f8ba11776d",
                          created_time: "2022-07-15T16:52:00.000Z",
                          last_edited_time: "2022-07-15T19:16:00.000Z",
                          created_by: {
                            object: "user",
                            id: "9b15170a-9941-4297-8ee6-83fa7649a87a"
                          },
                          rich_text: [
                            {
                              type: "text",
                              text: {
                                content: "Single comment",
                                link: null
                              },
                              annotations: {
                                bold: false,
                                italic: false,
                                strikethrough: false,
                                underline: false,
                                code: false,
                                color: "default"
                              },
                              plain_text: "Single comment",
                              href: null
                            }
                          ]
                        }
                      ],
                      next_cursor: null,
                      has_more: false,
                      type: "comment",
                      comment: {}
                    }
                  }
                }
              }
            }
          },
          "400": {
            description: "Bad request",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    object: {
                      type: "string",
                      example: "error"
                    },
                    status: {
                      type: "integer",
                      example: 400
                    },
                    code: {
                      type: "string"
                    },
                    message: {
                      type: "string"
                    }
                  }
                }
              }
            }
          }
        },
        deprecated: false,
        security: []
      },
      post: {
        summary: "Create comment",
        description: "Creates a comment in a page or existing discussion thread.",
        operationId: "create-a-comment",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: [
                  "parent",
                  "rich_text"
                ],
                properties: {
                  parent: {
                    type: "object",
                    description: "The page that contains the comment",
                    required: [
                      "page_id"
                    ],
                    properties: {
                      page_id: {
                        type: "string",
                        description: "the page ID"
                      }
                    }
                  },
                  rich_text: {
                    type: "array",
                    items: {
                      type: "object",
                      required: [
                        "text"
                      ],
                      properties: {
                        text: {
                          type: "object",
                          required: [
                            "content"
                          ],
                          properties: {
                            content: {
                              type: "string",
                              description: "The content of the comment"
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "200",
            content: {
              "application/json": {
                examples: {
                  Result: {
                    value: {
                      object: "comment",
                      id: "b52b8ed6-e029-4707-a671-832549c09de3",
                      parent: {
                        type: "page_id",
                        page_id: "5c6a2821-6bb1-4a7e-b6e1-c50111515c3d"
                      },
                      discussion_id: "f1407351-36f5-4c49-a13c-49f8ba11776d",
                      created_time: "2022-07-15T20:53:00.000Z",
                      last_edited_time: "2022-07-15T20:53:00.000Z",
                      created_by: {
                        object: "user",
                        id: "067dee40-6ebd-496f-b446-093c715fb5ec"
                      },
                      rich_text: [
                        {
                          type: "text",
                          text: {
                            content: "Hello world",
                            link: null
                          },
                          annotations: {
                            bold: false,
                            italic: false,
                            strikethrough: false,
                            underline: false,
                            code: false,
                            color: "default"
                          },
                          plain_text: "Hello world",
                          href: null
                        }
                      ]
                    }
                  }
                }
              }
            }
          },
          "400": {
            description: "Bad request",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    object: {
                      type: "string",
                      example: "error"
                    },
                    status: {
                      type: "integer",
                      example: 400
                    },
                    code: {
                      type: "string"
                    },
                    message: {
                      type: "string"
                    }
                  }
                }
              }
            }
          }
        },
        deprecated: false,
        security: []
      }
    },
    "/v1/data_sources/{data_source_id}/query": {
      post: {
        summary: "Query a data source",
        description: "Query a data source (database) using filters and sorts",
        operationId: "query-data-source",
        tags: [
          "Data sources"
        ],
        parameters: [
          {
            name: "data_source_id",
            in: "path",
            description: "Identifier for a Notion data source (database)",
            schema: {
              type: "string"
            },
            required: true
          },
          {
            name: "filter_properties",
            in: "query",
            description: "A list of page property value IDs to limit the response",
            schema: {
              type: "array",
              items: {
                type: "string"
              }
            }
          },
          {
            $ref: "#/components/parameters/notionVersion"
          }
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  filter: {
                    type: "object",
                    description: "Filter conditions for querying the data source"
                  },
                  sorts: {
                    type: "array",
                    items: {
                      $ref: "#/components/schemas/sortObject"
                    }
                  },
                  start_cursor: {
                    type: "string"
                  },
                  page_size: {
                    type: "integer",
                    default: 100
                  },
                  archived: {
                    type: "boolean"
                  },
                  in_trash: {
                    type: "boolean"
                  }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Successful response",
            content: {
              "application/json": {
                schema: {
                  type: "object"
                }
              }
            }
          },
          "400": {
            description: "Bad request",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    object: {
                      type: "string",
                      example: "error"
                    },
                    status: {
                      type: "integer",
                      example: 400
                    },
                    code: {
                      type: "string"
                    },
                    message: {
                      type: "string"
                    }
                  }
                }
              }
            }
          }
        },
        deprecated: false,
        security: []
      }
    },
    "/v1/data_sources/{data_source_id}": {
      get: {
        summary: "Retrieve a data source",
        description: "Retrieve metadata and schema for a data source",
        operationId: "retrieve-a-data-source",
        tags: [
          "Data sources"
        ],
        parameters: [
          {
            name: "data_source_id",
            in: "path",
            description: "Identifier for a Notion data source",
            schema: {
              type: "string"
            },
            required: true
          },
          {
            $ref: "#/components/parameters/notionVersion"
          }
        ],
        responses: {
          "200": {
            description: "Successful response",
            content: {
              "application/json": {
                schema: {
                  type: "object"
                }
              }
            }
          },
          "400": {
            description: "Bad request",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    object: {
                      type: "string",
                      example: "error"
                    },
                    status: {
                      type: "integer",
                      example: 400
                    },
                    code: {
                      type: "string"
                    },
                    message: {
                      type: "string"
                    }
                  }
                }
              }
            }
          }
        },
        deprecated: false,
        security: []
      },
      patch: {
        summary: "Update a data source",
        description: "Update properties of a data source",
        operationId: "update-a-data-source",
        tags: [
          "Data sources"
        ],
        parameters: [
          {
            name: "data_source_id",
            in: "path",
            description: "Identifier for a Notion data source",
            schema: {
              type: "string"
            },
            required: true
          },
          {
            $ref: "#/components/parameters/notionVersion"
          }
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  title: {
                    type: "array",
                    items: {
                      $ref: "#/components/schemas/richTextRequest"
                    }
                  },
                  description: {
                    type: "array",
                    items: {
                      $ref: "#/components/schemas/richTextRequest"
                    },
                    maxItems: 100
                  },
                  properties: {
                    type: "object",
                    description: "Property schema updates"
                  }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Successful response",
            content: {
              "application/json": {
                schema: {
                  type: "object"
                }
              }
            }
          },
          "400": {
            description: "Bad request",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    object: {
                      type: "string",
                      example: "error"
                    },
                    status: {
                      type: "integer",
                      example: 400
                    },
                    code: {
                      type: "string"
                    },
                    message: {
                      type: "string"
                    }
                  }
                }
              }
            }
          }
        },
        deprecated: false,
        security: []
      }
    },
    "/v1/data_sources": {
      post: {
        summary: "Create a data source",
        description: "Create a new data source (database)",
        operationId: "create-a-data-source",
        tags: [
          "Data sources"
        ],
        parameters: [
          {
            $ref: "#/components/parameters/notionVersion"
          }
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: [
                  "parent",
                  "properties"
                ],
                properties: {
                  parent: {
                    $ref: "#/components/schemas/pageIdParentRequest"
                  },
                  properties: {
                    type: "object",
                    description: "Property schema of data source"
                  },
                  title: {
                    type: "array",
                    items: {
                      $ref: "#/components/schemas/richTextRequest"
                    },
                    maxItems: 100
                  }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Successful response",
            content: {
              "application/json": {
                schema: {
                  type: "object"
                }
              }
            }
          },
          "400": {
            description: "Bad request",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    object: {
                      type: "string",
                      example: "error"
                    },
                    status: {
                      type: "integer",
                      example: 400
                    },
                    code: {
                      type: "string"
                    },
                    message: {
                      type: "string"
                    }
                  }
                }
              }
            }
          }
        },
        deprecated: false,
        security: []
      }
    },
    "/v1/data_sources/{data_source_id}/templates": {
      get: {
        summary: "List templates in a data source",
        description: "List available templates for a data source",
        operationId: "list-data-source-templates",
        tags: [
          "Data sources"
        ],
        parameters: [
          {
            name: "data_source_id",
            in: "path",
            description: "Identifier for a Notion data source",
            schema: {
              type: "string"
            },
            required: true
          },
          {
            name: "start_cursor",
            in: "query",
            schema: {
              type: "string"
            }
          },
          {
            name: "page_size",
            in: "query",
            schema: {
              type: "integer",
              default: 100
            }
          },
          {
            $ref: "#/components/parameters/notionVersion"
          }
        ],
        responses: {
          "200": {
            description: "Successful response",
            content: {
              "application/json": {
                schema: {
                  type: "object"
                }
              }
            }
          },
          "400": {
            description: "Bad request",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    object: {
                      type: "string",
                      example: "error"
                    },
                    status: {
                      type: "integer",
                      example: 400
                    },
                    code: {
                      type: "string"
                    },
                    message: {
                      type: "string"
                    }
                  }
                }
              }
            }
          }
        },
        deprecated: false,
        security: []
      }
    },
    "/v1/databases/{database_id}": {
      get: {
        summary: "Retrieve a database",
        description: "Retrieves a database object using the ID specified. Returns database metadata including the list of data source IDs contained in the database.",
        operationId: "retrieve-a-database",
        tags: [
          "Databases"
        ],
        parameters: [
          {
            name: "database_id",
            in: "path",
            description: "Identifier for a Notion database",
            schema: {
              type: "string"
            },
            required: true
          },
          {
            $ref: "#/components/parameters/notionVersion"
          }
        ],
        responses: {
          "200": {
            description: "Successful response",
            content: {
              "application/json": {
                schema: {
                  type: "object"
                }
              }
            }
          },
          "400": {
            description: "Bad request",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    object: {
                      type: "string",
                      example: "error"
                    },
                    status: {
                      type: "integer",
                      example: 400
                    },
                    code: {
                      type: "string"
                    },
                    message: {
                      type: "string"
                    }
                  }
                }
              }
            }
          }
        },
        deprecated: false,
        security: []
      }
    },
    "/v1/pages/{page_id}/move": {
      post: {
        summary: "Move a page",
        description: "Move a page to a different parent location",
        operationId: "move-page",
        tags: [
          "Pages"
        ],
        parameters: [
          {
            name: "page_id",
            in: "path",
            description: "Identifier for a Notion page",
            schema: {
              type: "string",
              format: "uuid"
            },
            required: true
          },
          {
            $ref: "#/components/parameters/notionVersion"
          }
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: [
                  "parent"
                ],
                properties: {
                  parent: {
                    $ref: "#/components/schemas/movePageParentRequest"
                  }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Successful response",
            content: {
              "application/json": {
                schema: {
                  type: "object"
                }
              }
            }
          },
          "400": {
            description: "Bad request",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    object: {
                      type: "string",
                      example: "error"
                    },
                    status: {
                      type: "integer",
                      example: 400
                    },
                    code: {
                      type: "string"
                    },
                    message: {
                      type: "string"
                    }
                  }
                }
              }
            }
          }
        },
        deprecated: false,
        security: []
      }
    },
    "/v1/file_uploads": {
      post: {
        summary: "Create a file upload",
        description: "Creates a file upload object. Returns an id used to send file contents and later attach the file to a page or block. Files must be attached within 1 hour of upload.",
        operationId: "create-file-upload",
        tags: [
          "File Uploads"
        ],
        parameters: [
          {
            $ref: "#/components/parameters/notionVersion"
          }
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: [
                  "filename",
                  "content_type"
                ],
                properties: {
                  filename: {
                    type: "string",
                    description: "Name of the file including extension (e.g. 'photo.png')"
                  },
                  content_type: {
                    type: "string",
                    description: "MIME type of the file (e.g. 'image/png', 'image/jpeg', 'application/pdf')"
                  },
                  mode: {
                    type: "string",
                    enum: [
                      "single_part",
                      "multi_part"
                    ],
                    description: "Upload mode. Use 'single_part' for files under 20MB, 'multi_part' for larger files."
                  },
                  number_of_parts: {
                    type: "integer",
                    description: "Number of parts for multi_part uploads. Required when mode is 'multi_part'."
                  }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "File upload object created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    id: {
                      type: "string",
                      description: "Unique identifier for the file upload"
                    },
                    status: {
                      type: "string",
                      enum: [
                        "pending",
                        "uploaded",
                        "expired",
                        "failed"
                      ]
                    },
                    upload_url: {
                      type: "string",
                      description: "URL to send the file contents to"
                    }
                  }
                }
              }
            }
          },
          "400": {
            description: "Bad request"
          }
        },
        deprecated: false,
        security: []
      }
    },
    "/v1/file_uploads/{file_upload_id}/send": {
      post: {
        summary: "Send file upload contents",
        description: "Uploads the actual file contents for a previously created file upload object. Uses multipart/form-data with the file under the 'file' key.",
        operationId: "send-file-upload",
        tags: [
          "File Uploads"
        ],
        parameters: [
          {
            name: "file_upload_id",
            in: "path",
            description: "Identifier of the file upload object",
            schema: {
              type: "string",
              format: "uuid"
            },
            required: true
          },
          {
            $ref: "#/components/parameters/notionVersion"
          }
        ],
        requestBody: {
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: [
                  "file"
                ],
                properties: {
                  file: {
                    type: "string",
                    format: "binary",
                    description: "The file to upload"
                  },
                  part_number: {
                    type: "integer",
                    description: "Part number for multi-part uploads (1-1000)"
                  }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "File uploaded successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    id: {
                      type: "string"
                    },
                    status: {
                      type: "string"
                    },
                    filename: {
                      type: "string"
                    },
                    content_type: {
                      type: "string"
                    },
                    content_length: {
                      type: "integer"
                    }
                  }
                }
              }
            }
          },
          "400": {
            description: "Bad request"
          }
        },
        deprecated: false,
        security: []
      }
    }
  }
};

// src/worker.ts
function base64urlEncode(data) {
  let binary = "";
  for (const byte of data) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
__name(base64urlEncode, "base64urlEncode");
function base64urlEncodeString(str) {
  return base64urlEncode(new TextEncoder().encode(str));
}
__name(base64urlEncodeString, "base64urlEncodeString");
function base64urlDecodeString(str) {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/") + "==".slice(0, (4 - str.length % 4) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}
__name(base64urlDecodeString, "base64urlDecodeString");
async function hmacSign(data, secret) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return base64urlEncode(new Uint8Array(sig));
}
__name(hmacSign, "hmacSign");
async function generateAccessToken(clientId, clientSecret) {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${clientId}:${clientSecret}`);
  const hash = await crypto.subtle.digest("SHA-256", data);
  const bytes = new Uint8Array(hash);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(generateAccessToken, "generateAccessToken");
async function verifyPkce(codeVerifier, codeChallenge, method) {
  if (!method || method === "plain") {
    return codeVerifier === codeChallenge;
  }
  if (method === "S256") {
    const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(codeVerifier));
    const computed = base64urlEncode(new Uint8Array(hash));
    return computed === codeChallenge;
  }
  return false;
}
__name(verifyPkce, "verifyPkce");
async function validateOAuthToken(request, env2) {
  if (!env2.OAUTH_CLIENT_ID || !env2.OAUTH_CLIENT_SECRET) {
    return true;
  }
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return false;
  const expected = await generateAccessToken(env2.OAUTH_CLIENT_ID, env2.OAUTH_CLIENT_SECRET);
  return token === expected;
}
__name(validateOAuthToken, "validateOAuthToken");
function handleOAuthMetadata(request) {
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;
  return Response.json({
    issuer: baseUrl,
    authorization_endpoint: `${baseUrl}/authorize`,
    token_endpoint: `${baseUrl}/oauth/token`,
    token_endpoint_auth_methods_supported: ["client_secret_post"],
    grant_types_supported: ["authorization_code"],
    response_types_supported: ["code"],
    code_challenge_methods_supported: ["S256", "plain"],
    scopes_supported: ["mcp"]
  });
}
__name(handleOAuthMetadata, "handleOAuthMetadata");
function handleProtectedResourceMetadata(request) {
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;
  return Response.json({
    resource: `${baseUrl}/mcp`,
    authorization_servers: [baseUrl],
    scopes_supported: ["mcp"]
  });
}
__name(handleProtectedResourceMetadata, "handleProtectedResourceMetadata");
async function handleAuthorize(request, env2) {
  const url = new URL(request.url);
  const clientId = url.searchParams.get("client_id");
  const redirectUri = url.searchParams.get("redirect_uri");
  const state = url.searchParams.get("state");
  const codeChallenge = url.searchParams.get("code_challenge");
  const codeChallengeMethod = url.searchParams.get("code_challenge_method");
  const responseType = url.searchParams.get("response_type");
  if (responseType !== "code") {
    return Response.json({ error: "unsupported_response_type" }, { status: 400 });
  }
  if (clientId !== env2.OAUTH_CLIENT_ID) {
    return Response.json({ error: "invalid_client" }, { status: 401 });
  }
  if (!redirectUri) {
    return Response.json({ error: "invalid_request", error_description: "redirect_uri required" }, { status: 400 });
  }
  const payload = JSON.stringify({
    cid: clientId,
    uri: redirectUri,
    cc: codeChallenge || "",
    ccm: codeChallengeMethod || "",
    exp: Date.now() + 5 * 60 * 1e3
    // 5 min expiry
  });
  const payloadB64 = base64urlEncodeString(payload);
  const signature = await hmacSign(payload, env2.OAUTH_CLIENT_SECRET);
  const code = `${payloadB64}.${signature}`;
  const callbackUrl = new URL(redirectUri);
  callbackUrl.searchParams.set("code", code);
  if (state) callbackUrl.searchParams.set("state", state);
  return Response.redirect(callbackUrl.toString(), 302);
}
__name(handleAuthorize, "handleAuthorize");
async function handleTokenRequest(request, env2) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  let params;
  const contentType = request.headers.get("Content-Type") || "";
  if (contentType.includes("application/x-www-form-urlencoded")) {
    params = new URLSearchParams(await request.text());
  } else if (contentType.includes("application/json")) {
    const body = await request.json();
    params = new URLSearchParams(body);
  } else {
    params = new URLSearchParams(await request.text());
  }
  const grantType = params.get("grant_type");
  const clientId = params.get("client_id");
  const clientSecret = params.get("client_secret");
  if (clientId !== env2.OAUTH_CLIENT_ID || clientSecret !== env2.OAUTH_CLIENT_SECRET) {
    return Response.json({ error: "invalid_client" }, { status: 401 });
  }
  if (grantType === "authorization_code") {
    const code = params.get("code");
    const codeVerifier = params.get("code_verifier");
    if (!code) {
      return Response.json({ error: "invalid_request", error_description: "code required" }, { status: 400 });
    }
    const dotIdx = code.lastIndexOf(".");
    if (dotIdx === -1) {
      return Response.json({ error: "invalid_grant" }, { status: 400 });
    }
    const payloadB64 = code.slice(0, dotIdx);
    const signature = code.slice(dotIdx + 1);
    let payload;
    try {
      payload = base64urlDecodeString(payloadB64);
    } catch {
      return Response.json({ error: "invalid_grant" }, { status: 400 });
    }
    const expectedSig = await hmacSign(payload, env2.OAUTH_CLIENT_SECRET);
    if (signature !== expectedSig) {
      return Response.json({ error: "invalid_grant" }, { status: 400 });
    }
    const data = JSON.parse(payload);
    if (Date.now() > data.exp) {
      return Response.json({ error: "invalid_grant", error_description: "code expired" }, { status: 400 });
    }
    if (data.cid !== clientId) {
      return Response.json({ error: "invalid_grant" }, { status: 400 });
    }
    if (data.cc && codeVerifier) {
      const pkceValid = await verifyPkce(codeVerifier, data.cc, data.ccm || "plain");
      if (!pkceValid) {
        return Response.json({ error: "invalid_grant", error_description: "PKCE verification failed" }, { status: 400 });
      }
    }
    const accessToken = await generateAccessToken(clientId, env2.OAUTH_CLIENT_SECRET);
    return Response.json({
      access_token: accessToken,
      token_type: "bearer",
      scope: "mcp"
    });
  }
  if (grantType === "client_credentials") {
    const accessToken = await generateAccessToken(clientId, env2.OAUTH_CLIENT_SECRET);
    return Response.json({
      access_token: accessToken,
      token_type: "bearer",
      scope: "mcp"
    });
  }
  return Response.json({ error: "unsupported_grant_type" }, { status: 400 });
}
__name(handleTokenRequest, "handleTokenRequest");
function deserializeParams(params) {
  const result = {};
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed.startsWith("{") && trimmed.endsWith("}") || trimmed.startsWith("[") && trimmed.endsWith("]")) {
        try {
          const parsed = JSON.parse(value);
          if (typeof parsed === "object" && parsed !== null) {
            result[key] = Array.isArray(parsed) ? parsed : deserializeParams(parsed);
            continue;
          }
        } catch {
        }
      }
    }
    result[key] = value;
  }
  return result;
}
__name(deserializeParams, "deserializeParams");
async function executeOperation(baseUrl, headers, operation, params) {
  let path = operation.path;
  const queryParams = new URLSearchParams();
  const bodyParams = { ...params };
  if (operation.parameters) {
    for (const p of operation.parameters) {
      const param = p;
      if (param.name && params[param.name] !== void 0) {
        if (param.in === "path") {
          path = path.replace(`{${param.name}}`, encodeURIComponent(String(params[param.name])));
          delete bodyParams[param.name];
        } else if (param.in === "query") {
          queryParams.set(param.name, String(params[param.name]));
          delete bodyParams[param.name];
        }
      }
    }
  }
  if (!operation.requestBody) {
    for (const [key, value] of Object.entries(bodyParams)) {
      if (value !== void 0) {
        queryParams.set(key, typeof value === "object" ? JSON.stringify(value) : String(value));
      }
    }
    for (const key of Object.keys(bodyParams)) delete bodyParams[key];
  }
  const qs = queryParams.toString();
  const url = `${baseUrl}${path}${qs ? "?" + qs : ""}`;
  const method = operation.method.toUpperCase();
  const hasBody = ["POST", "PATCH", "PUT", "DELETE"].includes(method) && Object.keys(bodyParams).length > 0;
  const fetchHeaders = { ...headers };
  if (!hasBody) {
    delete fetchHeaders["Content-Type"];
  }
  const response = await fetch(url, {
    method,
    headers: fetchHeaders,
    body: hasBody ? JSON.stringify(bodyParams) : void 0
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return {
      status: "error",
      ...typeof data === "object" && data !== null ? data : { data }
    };
  }
  return data;
}
__name(executeOperation, "executeOperation");
function operationIdToTitle(operationId) {
  return operationId.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2").split(/[\s_-]+/).map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}
__name(operationIdToTitle, "operationIdToTitle");
var cachedToolDefs = null;
function getToolDefs() {
  if (!cachedToolDefs) {
    const spec = notion_openapi_default;
    const converter = new OpenAPIToMCPConverter(spec);
    cachedToolDefs = converter.convertToMCPTools();
  }
  return cachedToolDefs;
}
__name(getToolDefs, "getToolDefs");
function buildToolRegistry(env2) {
  const registry = /* @__PURE__ */ new Map();
  const spec = notion_openapi_default;
  const baseUrl = spec.servers?.[0]?.url || "https://api.notion.com";
  const notionHeaders = {
    Authorization: `Bearer ${env2.NOTION_TOKEN}`,
    "Notion-Version": "2025-09-03",
    "Content-Type": "application/json",
    "User-Agent": "notion-mcp-server/worker"
  };
  const { tools, openApiLookup } = getToolDefs();
  for (const [toolName, def] of Object.entries(tools)) {
    for (const method of def.methods) {
      const fullName = `${toolName}-${method.name}`;
      const truncatedName = fullName.slice(0, 64);
      const operation = openApiLookup[fullName];
      const httpMethod = operation?.method?.toLowerCase();
      const isReadOnly = httpMethod === "get";
      registry.set(truncatedName, {
        tool: {
          name: truncatedName,
          description: method.description,
          inputSchema: method.inputSchema,
          annotations: {
            title: operationIdToTitle(method.name),
            ...isReadOnly ? { readOnlyHint: true } : { destructiveHint: true }
          }
        },
        handler: /* @__PURE__ */ __name(async (params) => {
          try {
            const result = await executeOperation(baseUrl, notionHeaders, operation, params);
            return { content: [{ type: "text", text: JSON.stringify(result) }] };
          } catch (error3) {
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify({
                    status: "error",
                    message: error3.message
                  })
                }
              ],
              isError: true
            };
          }
        }, "handler")
      });
    }
  }
  const mediaHeaders = {
    Authorization: `Bearer ${env2.NOTION_TOKEN}`,
    "Notion-Version": "2025-09-03"
  };
  const mediaDef = createGetMediaTool(mediaHeaders);
  registry.set(mediaDef.tool.name, {
    tool: {
      name: mediaDef.tool.name,
      description: mediaDef.tool.description,
      inputSchema: mediaDef.tool.inputSchema,
      annotations: mediaDef.tool.annotations
    },
    handler: mediaDef.handler
  });
  return registry;
}
__name(buildToolRegistry, "buildToolRegistry");
async function handleJsonRpc(request, registry) {
  const { method, id, params } = request;
  if (id === void 0 || id === null) return null;
  switch (method) {
    case "initialize":
      return {
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: "2024-11-05",
          capabilities: { tools: {} },
          serverInfo: { name: "Notion API", version: "1.0.0" }
        }
      };
    case "ping":
      return { jsonrpc: "2.0", id, result: {} };
    case "tools/list": {
      const tools = Array.from(registry.values()).map((e) => e.tool);
      return { jsonrpc: "2.0", id, result: { tools } };
    }
    case "tools/call": {
      const toolName = params?.name;
      const toolArgs = params?.arguments ?? {};
      const entry = registry.get(toolName);
      if (!entry) {
        return {
          jsonrpc: "2.0",
          id,
          error: { code: -32602, message: `Tool not found: ${toolName}` }
        };
      }
      try {
        const deserializedArgs = deserializeParams(toolArgs);
        const result = await entry.handler(deserializedArgs);
        return { jsonrpc: "2.0", id, result };
      } catch (error3) {
        return {
          jsonrpc: "2.0",
          id,
          error: { code: -32603, message: error3.message }
        };
      }
    }
    default:
      return {
        jsonrpc: "2.0",
        id,
        error: { code: -32601, message: `Method not found: ${method}` }
      };
  }
}
__name(handleJsonRpc, "handleJsonRpc");
var worker_default = {
  async fetch(request, env2) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, Mcp-Session-Id"
        }
      });
    }
    if (url.pathname === "/health" && request.method === "GET") {
      return Response.json({
        status: "healthy",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        tools: 25
      });
    }
    if (url.pathname === "/.well-known/oauth-authorization-server") {
      return handleOAuthMetadata(request);
    }
    if (url.pathname === "/.well-known/oauth-protected-resource") {
      return handleProtectedResourceMetadata(request);
    }
    if (url.pathname === "/authorize") {
      return handleAuthorize(request, env2);
    }
    if (url.pathname === "/oauth/token") {
      return handleTokenRequest(request, env2);
    }
    if (url.pathname !== "/mcp") {
      return new Response("Not found", { status: 404 });
    }
    if (request.method === "DELETE") {
      return new Response("", { status: 200 });
    }
    if (request.method === "GET") {
      return new Response("SSE not supported", { status: 405 });
    }
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }
    const isAuthorized = await validateOAuthToken(request, env2);
    if (!isAuthorized) {
      return Response.json(
        { jsonrpc: "2.0", error: { code: -32001, message: "Unauthorized" }, id: null },
        {
          status: 401,
          headers: {
            "WWW-Authenticate": `Bearer resource_metadata="${url.protocol}//${url.host}/.well-known/oauth-protected-resource"`
          }
        }
      );
    }
    let body;
    try {
      body = await request.json();
    } catch {
      return Response.json(
        { jsonrpc: "2.0", error: { code: -32700, message: "Parse error" }, id: null },
        { status: 400 }
      );
    }
    const registry = buildToolRegistry(env2);
    const isBatch = Array.isArray(body);
    const requests = isBatch ? body : [body];
    const responses = [];
    for (const req of requests) {
      const res = await handleJsonRpc(req, registry);
      if (res !== null) responses.push(res);
    }
    if (responses.length === 0) {
      return new Response("", { status: 202 });
    }
    return Response.json(isBatch ? responses : responses[0]);
  }
};
export {
  worker_default as default
};
//# sourceMappingURL=worker.js.map
