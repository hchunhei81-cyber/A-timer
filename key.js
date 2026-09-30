/* ============================================================
   key.js — Smart multi-language autocomplete engine
   Standalone. Exposes window.KeyHints.
   ============================================================ */
(function () {
'use strict';

/* ============================================================
   SECTION 1 — Keyword & API database
   ============================================================ */

const PY_KEYWORDS = [
    // Builtins
    'print','len','range','enumerate','zip','map','filter','sum','min','max','abs',
    'round','sorted','reversed','list','dict','set','tuple','str','int','float','bool',
    'bytes','bytearray','type','isinstance','issubclass','getattr','setattr','hasattr',
    'delattr','vars','dir','id','hash','repr','format','input','open','iter','next',
    'all','any','callable','chr','ord','hex','bin','oct','pow','divmod','globals',
    'locals','eval','exec','compile','help','exit','quit','breakpoint','object',
    'super','property','classmethod','staticmethod','slice','frozenset','complex',
    // Keywords
    'and','as','assert','async','await','break','class','continue','def','del',
    'elif','else','except','False','finally','for','from','global','if','import',
    'in','is','lambda','None','nonlocal','not','or','pass','raise','return',
    'True','try','while','with','yield','match','case','self','cls',
    // Common methods
    'append','extend','insert','remove','pop','clear','index','count','sort',
    'reverse','copy','keys','values','items','get','update','setdefault','split',
    'join','strip','replace','lower','upper','title','capitalize','startswith',
    'endswith','find','rfind','encode','decode','splitlines','zfill',
    '__init__','__str__','__repr__','__len__','__getitem__','__setitem__',
    '__iter__','__next__','__enter__','__exit__','__call__','__eq__','__hash__'
];

const PY_MODULES = {
    'math': ['sqrt','pi','e','sin','cos','tan','asin','acos','atan','atan2','log',
             'log10','log2','exp','pow','floor','ceil','fabs','fmod','factorial',
             'gcd','degrees','radians','hypot','inf','nan','tau'],
    'random': ['random','randint','randrange','choice','choices','shuffle','sample',
               'uniform','gauss','normalvariate','seed','getrandbits'],
    'os': ['path','getcwd','chdir','listdir','mkdir','makedirs','remove','rmdir',
           'rename','stat','environ','getenv','system','popen','walk','sep','linesep'],
    'sys': ['argv','exit','stdin','stdout','stderr','path','version','platform',
            'maxsize','getrecursionlimit','setrecursionlimit'],
    'json': ['loads','dumps','load','dump','JSONDecodeError'],
    're': ['compile','match','search','findall','finditer','sub','split','escape',
           'IGNORECASE','MULTILINE','DOTALL','VERBOSE'],
    'time': ['time','sleep','ctime','localtime','gmtime','strftime','strptime',
             'perf_counter','monotonic'],
    'datetime': ['datetime','date','time','timedelta','timezone','now','today',
                 'utcnow','strftime','strptime','timestamp','isoformat'],
    'collections': ['Counter','defaultdict','OrderedDict','namedtuple','deque','ChainMap'],
    'itertools': ['count','cycle','repeat','chain','compress','dropwhile','filterfalse',
                  'groupby','islice','permutations','combinations','product','starmap','takewhile','zip_longest'],
    'functools': ['reduce','partial','lru_cache','wraps','cmp_to_key','total_ordering'],
    'pathlib': ['Path','PurePath','PurePosixPath','PureWindowsPath'],
    'typing': ['List','Dict','Set','Tuple','Optional','Union','Any','Callable',
               'Iterable','Iterator','Sequence','Mapping','TypeVar','Generic','Literal'],
    'asyncio': ['run','create_task','gather','sleep','wait','wait_for','Queue','Lock','Event','Semaphore'],
    'threading': ['Thread','Lock','RLock','Event','Condition','Semaphore','Timer','current_thread'],
    'logging': ['debug','info','warning','error','critical','basicConfig','getLogger','FileHandler','StreamHandler'],
    'subprocess': ['run','call','check_call','check_output','Popen','PIPE','STDOUT','DEVNULL'],
    'urllib': ['request','parse','error'],
    'sqlite3': ['connect','Cursor','Connection','Row','IntegrityError','OperationalError'],
    'csv': ['reader','writer','DictReader','DictWriter','QUOTE_MINIMAL'],
    'io': ['StringIO','BytesIO','open'],
    'base64': ['b64encode','b64decode','urlsafe_b64encode','urlsafe_b64decode'],
    'hashlib': ['md5','sha1','sha256','sha512','sha3_256','new'],
    'decimal': ['Decimal','getcontext','ROUND_HALF_UP','ROUND_DOWN'],
    'statistics': ['mean','median','mode','stdev','variance','harmonic_mean','quantiles'],
    'string': ['ascii_letters','ascii_lowercase','ascii_uppercase','digits','hexdigits',
               'octdigits','punctuation','printable','whitespace','capwords','Template'],
    'numpy': ['array','arange','linspace','zeros','ones','eye','random','mean','std',
              'sum','max','min','argmax','argmin','reshape','transpose','dot','matmul',
              'concatenate','stack','split','where','unique','sort','argsort','nan','inf','pi','e'],
    'pandas': ['DataFrame','Series','read_csv','read_json','read_excel','concat','merge','to_datetime','to_numeric'],
    'matplotlib': ['pyplot','figure','plot','scatter','bar','hist','imshow','xlabel',
                   'ylabel','title','legend','show','savefig'],
    'pytest': ['fixture','mark','raises','approx','skip','importorskip']
};

const PY_SNIPPETS = [
    { label: 'def', text: 'def ${1:name}(${2:args}):\n    ${3:pass}', desc: 'Function definition' },
    { label: 'async def', text: 'async def ${1:name}(${2:args}):\n    ${3:pass}', desc: 'Async function' },
    { label: 'class', text: 'class ${1:Name}:\n    def __init__(self${2:, args}):\n        ${3:pass}', desc: 'Class' },
    { label: 'ifmain', text: 'if __name__ == "__main__":\n    ${1:main()}', desc: 'Main guard' },
    { label: 'for', text: 'for ${1:i} in ${2:range(10)}:\n    ${3:print(i)}', desc: 'For loop' },
    { label: 'for enu', text: 'for ${1:i}, ${2:item} in enumerate(${3:items}):\n    ${4:print(i, item)}', desc: 'Enumerate loop' },
    { label: 'while', text: 'while ${1:condition}:\n    ${2:pass}', desc: 'While loop' },
    { label: 'try', text: 'try:\n    ${1:pass}\nexcept ${2:Exception} as e:\n    print(e)', desc: 'Try/except' },
    { label: 'with', text: 'with open("${1:file.txt}", "${2:r}") as f:\n    ${3:content = f.read()}', desc: 'With open' },
    { label: 'import', text: 'import ${1:module}', desc: 'Import module' },
    { label: 'from', text: 'from ${1:module} import ${2:name}', desc: 'From-import' },
    { label: 'lambda', text: 'lambda ${1:x}: ${2:x * 2}', desc: 'Lambda' },
    { label: 'listcomp', text: '[${1:x} for ${1:x} in ${2:iterable} if ${3:condition}]', desc: 'List comprehension' },
    { label: 'dictcomp', text: '{${1:k}: ${2:v} for ${1:k}, ${2:v} in ${3:items}}', desc: 'Dict comprehension' },
    { label: 'fstring', text: 'f"${1:text} {${2:variable}}"', desc: 'F-string' }
];

const C_KEYWORDS = [
    // Types
    'int','char','float','double','void','short','long','signed','unsigned','size_t',
    'ssize_t','bool','true','false','const','static','extern','volatile','register',
    'auto','struct','union','enum','typedef','inline','restrict','_Bool','_Complex',
    // Keywords
    'if','else','for','while','do','switch','case','default','break','continue',
    'return','goto','sizeof','NULL','offsetof',
    // stdio
    'printf','fprintf','sprintf','snprintf','vprintf','vfprintf','vsprintf','scanf',
    'fscanf','sscanf','puts','fputs','putchar','fputc','getchar','fgetc','gets',
    'fgets','fopen','fclose','fread','fwrite','fseek','ftell','rewind','feof',
    'ferror','fflush','clearerr','perror','remove','rename','tmpfile','setbuf',
    'setvbuf','SEEK_SET','SEEK_CUR','SEEK_END','EOF','stdin','stdout','stderr',
    // stdlib
    'malloc','calloc','realloc','free','atoi','atof','atol','atoll','strtol','strtoul',
    'strtod','strtof','abs','labs','llabs','div','ldiv','rand','srand','exit','abort',
    'atexit','system','getenv','setenv','unsetenv','qsort','bsearch','EXIT_SUCCESS','EXIT_FAILURE',
    // string
    'strlen','strcpy','strncpy','strcat','strncat','strcmp','strncmp','strchr','strrchr',
    'strstr','strtok','strdup','strspn','strcspn','strpbrk','memcpy','memmove','memset','memcmp','memchr',
    // math
    'sqrt','sqrtf','sqrtl','pow','powf','exp','expf','log','logf','log10','log10f',
    'sin','sinf','cos','cosf','tan','tanf','asin','acos','atan','atan2','sinh','cosh',
    'tanh','floor','floorf','ceil','ceilf','round','roundf','trunc','fabs','fmod',
    'fmin','fmax','fdim','hypot','cbrt','INFINITY','NAN','M_PI','M_E','M_SQRT2','M_LN2',
    // ctype
    'isalpha','isdigit','isalnum','isspace','isupper','islower','ispunct','iscntrl',
    'isxdigit','isprint','isgraph','toupper','tolower',
    // time
    'time','clock','difftime','mktime','localtime','gmtime','strftime','strptime','time_t','struct_tm',
    // assert
    'assert','static_assert',
    // limits
    'INT_MAX','INT_MIN','UINT_MAX','LONG_MAX','LONG_MIN','ULONG_MAX','CHAR_MAX','CHAR_MIN',
    'SHRT_MAX','SHRT_MIN','LLONG_MAX','LLONG_MIN','FLT_MAX','DBL_MAX','FLT_MIN','DBL_MIN','FLT_EPSILON','DBL_EPSILON'
];

const C_HEADERS = [
    'stdio.h','stdlib.h','string.h','math.h','time.h','ctype.h','stddef.h','stdint.h',
    'stdbool.h','assert.h','errno.h','limits.h','float.h','signal.h','setjmp.h',
    'locale.h','wchar.h','wctype.h','complex.h','fenv.h','inttypes.h','iso646.h',
    'stdalign.h','stdarg.h','stdatomic.h','stdnoreturn.h','tgmath.h','threads.h','uchar.h',
    'unistd.h','fcntl.h','sys/types.h','sys/stat.h','sys/wait.h','sys/socket.h',
    'netinet/in.h','arpa/inet.h','pthread.h','dirent.h','dlfcn.h','poll.h','select.h','semaphore.h'
];

const C_SNIPPETS = [
    { label: 'main', text: 'int main(void) {\n    ${1:printf("Hello, World!\\n");}\n    return 0;\n}', desc: 'Main function' },
    { label: 'main args', text: 'int main(int argc, char *argv[]) {\n    ${1:return 0;}\n}', desc: 'Main with args' },
    { label: 'printf', text: 'printf("${1:%d}\\n", ${2:value});', desc: 'Printf' },
    { label: 'scanf', text: 'scanf("${1:%d}", &${2:variable});', desc: 'Scanf' },
    { label: 'for', text: 'for (int ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {\n    ${3}\n}', desc: 'For loop' },
    { label: 'while', text: 'while (${1:condition}) {\n    ${2}\n}', desc: 'While loop' },
    { label: 'if', text: 'if (${1:condition}) {\n    ${2}\n}', desc: 'If' },
    { label: 'ifelse', text: 'if (${1:condition}) {\n    ${2}\n} else {\n    ${3}\n}', desc: 'If/else' },
    { label: 'struct', text: 'typedef struct {\n    ${1:int x;}\n    ${2:int y;}\n} ${3:Name};', desc: 'Struct' },
    { label: 'enum', text: 'typedef enum {\n    ${1:VALUE_A},\n    ${2:VALUE_B}\n} ${3:Name};', desc: 'Enum' },
    { label: 'include', text: '#include <${1:stdio.h}>', desc: 'Include' },
    { label: 'define', text: '#define ${1:NAME} ${2:value}', desc: 'Define' },
    { label: 'ifdef', text: '#ifdef ${1:MACRO}\n    ${2}\n#endif', desc: 'Ifdef' },
    { label: 'malloc', text: '${1:int *p} = malloc(${2:sizeof(int) * n});\nif (!${1:p}) { perror("malloc"); exit(1); }', desc: 'Malloc + check' },
    { label: 'free', text: 'free(${1:ptr});\n${1:ptr} = NULL;', desc: 'Free + null' }
];

const CPP_KEYWORDS = [
    // Same core C keywords
    'int','char','float','double','void','short','long','signed','unsigned','bool',
    'auto','const','constexpr','static','extern','volatile','mutable','inline','virtual',
    'struct','class','union','enum','typedef','using','namespace','template','typename',
    'if','else','for','while','do','switch','case','default','break','continue',
    'return','goto','sizeof','new','delete','this','nullptr','true','false',
    'try','catch','throw','public','private','protected','override','final','friend',
    'operator','explicit','static_cast','dynamic_cast','const_cast','reinterpret_cast',
    'noexcept','decltype','constinit','consteval','concept','requires','co_await','co_return','co_yield',
    // std types
    'std','string','wstring','u16string','u32string','vector','array','deque','list',
    'forward_list','map','multimap','set','multiset','unordered_map','unordered_set',
    'unordered_multimap','unordered_multiset','stack','queue','priority_queue','pair',
    'tuple','optional','variant','any','function','shared_ptr','unique_ptr','weak_ptr',
    'make_shared','make_unique','enable_shared_from_this','initializer_list',
    'string_view','span','byte','chrono','ratio','complex','valarray','bitset',
    'allocator','iterator','const_iterator','reverse_iterator','istream','ostream',
    'iostream','ifstream','ofstream','fstream','stringstream','istringstream','ostringstream',
    'cin','cout','cerr','clog','endl','ends','flush','ws','getline','sync_with_stdio',
    // Methods
    'begin','end','cbegin','cend','rbegin','rend','size','length','capacity','empty',
    'clear','resize','reserve','shrink_to_fit','push_back','pop_back','emplace_back',
    'push_front','pop_front','emplace_front','insert','erase','swap','assign','at',
    'front','back','data','find','count','contains','lower_bound','upper_bound',
    'equal_range','to_string','stoi','stol','stoll','stof','stod','c_str','substr',
    'append','compare','copy','replace','insert','npos','max_size',
    // algorithms
    'sort','stable_sort','partial_sort','nth_element','reverse','rotate','shuffle',
    'find','find_if','find_if_not','count','count_if','all_of','any_of','none_of',
    'min_element','max_element','minmax_element','accumulate','reduce','inner_product',
    'for_each','transform','copy','copy_if','copy_n','copy_backward','fill','fill_n',
    'generate','generate_n','remove','remove_if','unique','partition','stable_partition',
    'merge','inplace_merge','set_union','set_intersection','set_difference','lower_bound',
    'upper_bound','binary_search','equal_range','includes','lexicographical_compare',
    'next_permutation','prev_permutation','iota','clamp','gcd','lcm','midpoint','swap',
    // Math
    'sqrt','cbrt','pow','exp','exp2','expm1','log','log2','log10','log1p','sin','cos',
    'tan','asin','acos','atan','atan2','sinh','cosh','tanh','asinh','acosh','atanh',
    'floor','ceil','trunc','round','nearbyint','rint','fabs','abs','fmod','remainder',
    'fmin','fmax','fdim','hypot','M_PI','M_E','INFINITY','NAN',
    // Stream manipulators
    'setw','setprecision','setfill','setbase','fixed','scientific','hexfloat','defaultfloat',
    'hex','dec','oct','boolalpha','noboolalpha','showbase','noshowbase','uppercase',
    'left','right','internal','setiosflags','resetiosflags'
];

const CPP_HEADERS = [
    'iostream','iomanip','ios','istream','ostream','fstream','sstream','strstream',
    'string','string_view','vector','array','deque','list','forward_list','map',
    'set','unordered_map','unordered_set','stack','queue','iterator','algorithm',
    'numeric','functional','memory','utility','tuple','type_traits','typeinfo',
    'exception','stdexcept','system_error','optional','variant','any','chrono',
    'thread','mutex','shared_mutex','condition_variable','future','atomic','ratio',
    'random','regex','complex','valarray','bitset','limits','locale','codecvt',
    'cassert','cctype','cerrno','cfenv','cfloat','cinttypes','climits','clocale',
    'cmath','csetjmp','csignal','cstdarg','cstddef','cstdint','cstdio','cstdlib',
    'cstring','ctime','cwchar','cwctype','filesystem','memory_resource','span'
];

const RUST_KEYWORDS = [
    'fn','let','mut','const','static','struct','enum','trait','impl','for','while',
    'loop','if','else','match','return','break','continue','use','mod','pub','crate',
    'self','Self','super','as','in','ref','move','async','await','dyn','where','type',
    'unsafe','extern','macro_rules','macro','true','false','ref','dyn','priv',
    // Types
    'i8','i16','i32','i64','i128','isize','u8','u16','u32','u64','u128','usize',
    'f32','f64','bool','char','str','String','&str','Vec','VecDeque','LinkedList',
    'HashMap','HashSet','BTreeMap','BTreeSet','BinaryHeap','Option','Result','Box',
    'Rc','Arc','RefCell','Cell','Mutex','RwLock','Cow','Pin','PhantomData',
    'Some','None','Ok','Err',
    // Macros
    'println!','print!','eprintln!','eprint!','format!','vec!','panic!','assert!',
    'assert_eq!','assert_ne!','debug_assert!','debug_assert_eq!','debug_assert_ne!',
    'unreachable!','todo!','unimplemented!','write!','writeln!','dbg!','matches!',
    'include!','include_str!','include_bytes!','env!','option_env!','concat!','stringify!',
    'cfg!','compile_error!','file!','line!','column!','module_path!',
    // Common methods
    'len','is_empty','push','push_str','pop','insert','remove','clear','retain',
    'iter','iter_mut','into_iter','drain','split_off','truncate',
    'map','filter','filter_map','flat_map','fold','reduce','for_each','any','all',
    'find','find_map','position','count','sum','product','min','max','min_by','max_by',
    'collect','chain','zip','enumerate','take','skip','take_while','skip_while',
    'peekable','rev','cycle','step_by','windows','chunks',
    'unwrap','expect','unwrap_or','unwrap_or_else','unwrap_or_default','ok','err',
    'is_ok','is_err','is_some','is_none','and_then','or_else','map_err',
    'to_string','to_owned','to_vec','as_ref','as_mut','as_str','as_slice',
    'parse','trim','trim_start','trim_end','split','split_whitespace','split_once',
    'join','replace','contains','starts_with','ends_with','find','rfind','chars',
    'bytes','lines','to_lowercase','to_uppercase','repeat','is_alphabetic','is_numeric',
    'clone','deref','borrow','borrow_mut','into','from',
    // std modules
    'std','core','alloc','io','fs','path','env','process','thread','sync','time',
    'collections','fmt','cmp','ops','mem','ptr','str','string','num','convert','iter',
    'slice','vec','result','option','boxed','rc','cell','any','error','marker'
];

const RUST_SNIPPETS = [
    { label: 'main', text: 'fn main() {\n    println!("${1:Hello, World!}");\n}', desc: 'Main function' },
    { label: 'fn', text: 'fn ${1:name}(${2:args}) -> ${3:ReturnType} {\n    ${4}\n}', desc: 'Function' },
    { label: 'struct', text: '#[derive(Debug, Clone)]\nstruct ${1:Name} {\n    ${2:field}: ${3:Type},\n}', desc: 'Struct' },
    { label: 'enum', text: '#[derive(Debug)]\nenum ${1:Name} {\n    ${2:Variant,}\n}', desc: 'Enum' },
    { label: 'impl', text: 'impl ${1:Type} {\n    fn ${2:new}(${3}) -> Self {\n        Self { ${4} }\n    }\n}', desc: 'Impl block' },
    { label: 'trait', text: 'trait ${1:Name} {\n    fn ${2:method}(&self) -> ${3:Type};\n}', desc: 'Trait' },
    { label: 'match', text: 'match ${1:value} {\n    ${2:pattern} => ${3:result},\n    _ => ${4:default},\n}', desc: 'Match' },
    { label: 'for', text: 'for ${1:item} in ${2:iter} {\n    ${3}\n}', desc: 'For loop' },
    { label: 'loop', text: 'loop {\n    ${1:break;}\n}', desc: 'Loop' },
    { label: 'while', text: 'while ${1:condition} {\n    ${2}\n}', desc: 'While' },
    { label: 'println', text: 'println!("${1:{}}", ${2:value});', desc: 'Println' },
    { label: 'iflet', text: 'if let ${1:Some(x)} = ${2:expr} {\n    ${3}\n}', desc: 'If-let' },
    { label: 'use', text: 'use ${1:std::collections::HashMap};', desc: 'Use statement' },
    { label: 'test', text: '#[cfg(test)]\nmod tests {\n    use super::*;\n\n    #[test]\n    fn test_${1:name}() {\n        assert_eq!(${2:actual}, ${3:expected});\n    }\n}', desc: 'Test module' }
];

const GO_KEYWORDS = [
    'break','case','chan','const','continue','default','defer','else','fallthrough',
    'for','func','go','goto','if','import','interface','map','package','range',
    'return','select','struct','switch','type','var','nil','true','false','iota',
    // Types
    'int','int8','int16','int32','int64','uint','uint8','uint16','uint32','uint64',
    'uintptr','float32','float64','complex64','complex128','bool','byte','rune','string',
    'error','any','comparable',
    // Builtins
    'append','cap','close','complex','copy','delete','imag','len','make','new',
    'panic','print','println','real','recover','min','max','clear',
    // fmt
    'fmt.Println','fmt.Printf','fmt.Sprintf','fmt.Sprint','fmt.Sprintln','fmt.Sprintfln',
    'fmt.Print','fmt.Errorf','fmt.Fprintf','fmt.Fprintln','fmt.Scanln','fmt.Scanf',
    'fmt.Scan','fmt.Fscan','fmt.Sscan',
    // os
    'os.Args','os.Exit','os.Getenv','os.Setenv','os.Open','os.Create','os.Remove',
    'os.Mkdir','os.MkdirAll','os.Stat','os.ReadFile','os.WriteFile','os.Stdin','os.Stdout','os.Stderr',
    // io
    'io.Reader','io.Writer','io.Copy','io.ReadAll','io.EOF','io/ioutil',
    // bufio
    'bufio.NewReader','bufio.NewScanner','bufio.NewWriter','bufio.ScanLines',
    // strings
    'strings.Split','strings.Join','strings.Contains','strings.HasPrefix','strings.HasSuffix',
    'strings.ToLower','strings.ToUpper','strings.TrimSpace','strings.Trim','strings.TrimLeft',
    'strings.TrimRight','strings.Replace','strings.ReplaceAll','strings.Index','strings.LastIndex',
    'strings.Repeat','strings.Fields','strings.Builder','strings.NewReplacer',
    // strconv
    'strconv.Itoa','strconv.Atoi','strconv.ParseInt','strconv.ParseFloat','strconv.ParseBool',
    'strconv.FormatInt','strconv.FormatFloat','strconv.Quote','strconv.Unquote',
    // math
    'math.Sqrt','math.Pow','math.Abs','math.Max','math.Min','math.Floor','math.Ceil',
    'math.Round','math.Trunc','math.Mod','math.Pi','math.E','math.Inf','math.NaN',
    'math.Sin','math.Cos','math.Tan','math.Log','math.Log2','math.Log10','math.Exp',
    // sort
    'sort.Ints','sort.Strings','sort.Float64s','sort.Slice','sort.SliceStable','sort.Search',
    // sync
    'sync.Mutex','sync.RWMutex','sync.WaitGroup','sync.Once','sync.Map','sync.Cond','sync.Pool',
    // time
    'time.Now','time.Sleep','time.Since','time.Duration','time.Second','time.Millisecond',
    'time.Microsecond','time.Nanosecond','time.Minute','time.Hour','time.Parse','time.Format',
    // errors
    'errors.New','errors.Is','errors.As','errors.Unwrap',
    // context
    'context.Background','context.TODO','context.WithCancel','context.WithTimeout','context.WithDeadline','context.WithValue',
    // net/http
    'http.HandleFunc','http.ListenAndServe','http.Get','http.Post','http.Client','http.Request','http.Response',
    // encoding/json
    'json.Marshal','json.Unmarshal','json.MarshalIndent','json.NewEncoder','json.NewDecoder',
    // log
    'log.Println','log.Printf','log.Fatal','log.Fatalf','log.Panic','log.New',
    // testing
    'testing.T','testing.B','testing.M','t.Error','t.Errorf','t.Fatal','t.Fatalf','t.Log','t.Logf',
    // other
    'bufio','bytes','io','os','fmt','math','strings','strconv','sort','sync','time',
    'errors','context','reflect','regexp','runtime','unicode','utf8','path','filepath'
];

const GO_SNIPPETS = [
    { label: 'main', text: 'package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("${1:Hello, World!}")\n}', desc: 'Main package' },
    { label: 'func', text: 'func ${1:name}(${2:args}) ${3:returnType} {\n    ${4}\n}', desc: 'Function' },
    { label: 'struct', text: 'type ${1:Name} struct {\n    ${2:Field} ${3:Type}\n}', desc: 'Struct' },
    { label: 'interface', text: 'type ${1:Name} interface {\n    ${2:Method}(${3:args}) ${4:returnType}\n}', desc: 'Interface' },
    { label: 'method', text: 'func (${1:r} *${2:Type}) ${3:Method}(${4:args}) ${5:returnType} {\n    ${6}\n}', desc: 'Method' },
    { label: 'for range', text: 'for ${1:i}, ${2:v} := range ${3:slice} {\n    ${4}\n}', desc: 'Range loop' },
    { label: 'for', text: 'for ${1:i} := 0; ${1:i} < ${2:n}; ${1:i}++ {\n    ${3}\n}', desc: 'For loop' },
    { label: 'for infinite', text: 'for {\n    ${1:break}\n}', desc: 'Infinite loop' },
    { label: 'if err', text: 'if err != nil {\n    ${1:return err}\n}', desc: 'Error check' },
    { label: 'if err inline', text: 'if err := ${1:do()}; err != nil {\n    ${2:return err}\n}', desc: 'Inline error check' },
    { label: 'import', text: 'import (\n    "${1:fmt}"\n)', desc: 'Import block' },
    { label: 'slice', text: '${1:items} := []${2:string}{${3}}', desc: 'Slice literal' },
    { label: 'map', text: '${1:m} := map[${2:string}]${3:int}{}', desc: 'Map literal' },
    { label: 'goroutine', text: 'go func() {\n    ${1}\n}()', desc: 'Goroutine' }
];

const ASM_KEYWORDS = [
    // x86-64 instructions
    'mov','movzx','movsx','movsxd','lea','xchg','push','pop','pushf','popf','pusha','popa',
    'add','sub','mul','imul','div','idiv','inc','dec','neg','adc','sbb',
    'and','or','xor','not','shl','shr','sal','sar','rol','ror','rcl','rcr',
    'cmp','test','je','jne','jz','jnz','jg','jge','jl','jle','ja','jae','jb','jbe',
    'jo','jno','js','jns','jp','jnp','jcxz','jecxz','jrcxz',
    'jmp','call','ret','retf','leave','enter','nop','hlt','int','int3','syscall','sysret','sysenter',
    'loop','loope','loopne',
    // SSE / SSE2
    'movss','movsd','movaps','movups','movapd','movupd','movdqa','movdqu',
    'addss','addsd','addps','addpd','subss','subsd','subps','subpd',
    'mulss','mulsd','mulps','mulpd','divss','divsd','divps','divpd',
    'sqrtss','sqrtsd','sqrtps','sqrtpd','maxss','minsd',
    'ucomiss','ucomisd','comiss','comisd','xorpd','andpd','orpd','xorps','andps','orps',
    'cvtsi2ss','cvtsi2sd','cvtss2si','cvtsd2si','cvttss2si','cvttsd2si',
    'cvtss2sd','cvtsd2ss','movd','movq','pxor','paddd','paddq','psubd','psubq',
    // Conditional move / set
    'cmovz','cmovnz','cmovg','cmovge','cmovl','cmovle','cmova','cmovae','cmovb','cmovbe',
    'setz','setnz','setg','setge','setl','setle','seta','setae','setb','setbe',
    // Conversion
    'cqo','cdq','cwd','cbw','cltq','cltd','cdqe','cwde',
    // Bit manipulation
    'bsf','bsr','bswap','popcnt','lzcnt','tzcnt','andn','bextr','blsi','blsr','blsmsk',
    'pext','pdep','mulx','rorx','sarx','shlx','shrx',
    // Atomics
    'lock','xadd','cmpxchg','cmpxchg8b','cmpxchg16b','mfence','lfence','sfence',
    // String
    'rep','repe','repne','repz','repnz','movsb','movsw','movsd','movsq',
    'stosb','stosw','stosd','stosq','lodsb','lodsw','lodsd','lodsq',
    'scasb','scasw','scasd','scasq','cmpsb','cmpsw','cmpsd','cmpsq',
    // Registers (64-bit)
    'rax','rbx','rcx','rdx','rsi','rdi','rbp','rsp','r8','r9','r10','r11','r12','r13','r14','r15',
    'rip','rflags',
    // Registers (32-bit)
    'eax','ebx','ecx','edx','esi','edi','ebp','esp','r8d','r9d','r10d','r11d','r12d','r13d','r14d','r15d',
    'eip','eflags',
    // Registers (16-bit)
    'ax','bx','cx','dx','si','di','bp','sp','r8w','r9w','r10w','r11w','r12w','r13w','r14w','r15w',
    // Registers (8-bit)
    'al','bl','cl','dl','sil','dil','bpl','spl','ah','bh','ch','dh',
    'r8b','r9b','r10b','r11b','r12b','r13b','r14b','r15b',
    // SSE registers
    'xmm0','xmm1','xmm2','xmm3','xmm4','xmm5','xmm6','xmm7','xmm8','xmm9','xmm10',
    'xmm11','xmm12','xmm13','xmm14','xmm15',
    // Directives
    'section','segment','global','extern','default','bits','org','align','times',
    'db','dw','dd','dq','dt','do','dy','dz','resb','resw','resd','resq','rest',
    'equ','byte','word','dword','qword','tword','oword','yword','zword','ptr',
    '%macro','%endmacro','%define','%include','%ifdef','%ifndef','%endif','%else',
    // Syscall numbers (Linux x86-64)
    'sys_read','sys_write','sys_open','sys_close','sys_stat','sys_fstat','sys_lstat',
    'sys_poll','sys_lseek','sys_mmap','sys_mprotect','sys_munmap','sys_brk',
    'sys_ioctl','sys_access','sys_pipe','sys_select','sys_sched_yield',
    'sys_mremap','sys_msync','sys_mincore','sys_madvise','sys_shmget',
    'sys_dup','sys_dup2','sys_pause','sys_nanosleep','sys_getitimer','sys_alarm',
    'sys_setitimer','sys_getpid','sys_sendfile','sys_socket','sys_connect',
    'sys_accept','sys_sendto','sys_recvfrom','sys_sendmsg','sys_recvmsg',
    'sys_shutdown','sys_bind','sys_listen','sys_getsockname','sys_getpeername',
    'sys_socketpair','sys_setsockopt','sys_getsockopt','sys_clone','sys_fork',
    'sys_vfork','sys_execve','sys_exit','sys_wait4','sys_kill','sys_uname',
    'sys_fcntl','sys_flock','sys_fsync','sys_fdatasync','sys_truncate','sys_ftruncate'
];

const ASM_SNIPPETS = [
    { label: 'section .data', text: 'section .data\n    ${1:msg db \'Hello, World!\', 10}\n    ${2:len equ $ - msg}', desc: 'Data section' },
    { label: 'section .bss', text: 'section .bss\n    ${1:buffer resb 64}', desc: 'BSS section' },
    { label: 'global _start', text: 'section .text\n    global _start\n\n_start:\n    ${1}', desc: 'Entry point' },
    { label: 'write syscall', text: '; write(1, msg, len)\nmov rax, 1\nmov rdi, 1\nmov rsi, ${1:msg}\nmov rdx, ${2:len}\nsyscall', desc: 'Write syscall' },
    { label: 'read syscall', text: '; read(0, buf, len)\nmov rax, 0\nmov rdi, 0\nmov rsi, ${1:buf}\nmov rdx, ${2:len}\nsyscall', desc: 'Read syscall' },
    { label: 'exit syscall', text: '; exit(0)\nmov rax, 60\nxor rdi, rdi\nsyscall', desc: 'Exit syscall' },
    { label: 'function', text: '${1:name}:\n    push rbp\n    mov rbp, rsp\n    ${2}\n    pop rbp\n    ret', desc: 'Function prologue' },
    { label: 'loop', text: 'mov rcx, ${1:count}\n.${2:loop}:\n    ${3}\n    dec rcx\n    jnz .${2:loop}', desc: 'Loop' },
    { label: 'db', text: '${1:msg} db "${2:Hello, World!}", 10', desc: 'Define bytes' },
    { label: 'equ', text: '${1:NAME} equ ${2:value}', desc: 'Define constant' }
];

const LUA_KEYWORDS = [
    'and','break','do','else','elseif','end','false','for','function','goto',
    'if','in','local','nil','not','or','repeat','return','then','true','until','while',
    // Builtins
    'print','type','tostring','tonumber','pairs','ipairs','next','select','rawget',
    'rawset','rawequal','rawlen','setmetatable','getmetatable','assert','error',
    'pcall','xpcall','require','dofile','load','loadfile','collectgarbage','_G','_VERSION',
    // String
    'string.format','string.sub','string.len','string.upper','string.lower','string.rep',
    'string.find','string.match','string.gmatch','string.gsub','string.byte','string.char',
    'string.reverse',
    // Table
    'table.insert','table.remove','table.concat','table.sort','table.unpack','table.pack',
    // Math
    'math.abs','math.ceil','math.floor','math.max','math.min','math.sqrt','math.pow',
    'math.exp','math.log','math.sin','math.cos','math.tan','math.asin','math.acos',
    'math.atan','math.random','math.randomseed','math.pi','math.huge','math.maxinteger',
    'math.mininteger','math.fmod','math.modf','math.tointeger','math.type','math.ult',
    // IO
    'io.write','io.read','io.open','io.close','io.lines','io.stdout','io.stderr','io.stdin',
    // OS
    'os.time','os.date','os.clock','os.getenv','os.exit','os.remove','os.rename','os.tmpname','os.execute'
];

const LUA_SNIPPETS = [
    { label: 'function', text: 'function ${1:name}(${2:args})\n    ${3}\nend', desc: 'Function' },
    { label: 'local fn', text: 'local function ${1:name}(${2:args})\n    ${3}\nend', desc: 'Local function' },
    { label: 'for', text: 'for ${1:i} = ${2:1}, ${3:10} do\n    ${4}\nend', desc: 'Numeric for' },
    { label: 'for pairs', text: 'for ${1:k}, ${2:v} in pairs(${3:t}) do\n    ${4}\nend', desc: 'Pairs loop' },
    { label: 'for ipairs', text: 'for ${1:i}, ${2:v} in ipairs(${3:t}) do\n    ${4}\nend', desc: 'Ipairs loop' },
    { label: 'if', text: 'if ${1:condition} then\n    ${2}\nend', desc: 'If' },
    { label: 'if else', text: 'if ${1:condition} then\n    ${2}\nelse\n    ${3}\nend', desc: 'If/else' },
    { label: 'while', text: 'while ${1:condition} do\n    ${2}\nend', desc: 'While' },
    { label: 'repeat', text: 'repeat\n    ${1}\nuntil ${2:condition}', desc: 'Repeat-until' },
    { label: 'print', text: 'print(${1:value})', desc: 'Print' }
];

const SQL_KEYWORDS = [
    // Statements
    'SELECT','FROM','WHERE','INSERT INTO','VALUES','UPDATE','SET','DELETE FROM',
    'CREATE TABLE','CREATE INDEX','CREATE VIEW','CREATE DATABASE','CREATE SCHEMA',
    'DROP TABLE','DROP INDEX','DROP VIEW','DROP DATABASE',
    'ALTER TABLE','ADD COLUMN','DROP COLUMN','RENAME TO',
    'TRUNCATE','MERGE','REPLACE','UPSERT',
    'BEGIN','COMMIT','ROLLBACK','SAVEPOINT','GRANT','REVOKE',
    // Clauses
    'JOIN','INNER JOIN','LEFT JOIN','LEFT OUTER JOIN','RIGHT JOIN','RIGHT OUTER JOIN',
    'FULL JOIN','FULL OUTER JOIN','CROSS JOIN','NATURAL JOIN','ON','USING',
    'GROUP BY','ORDER BY','HAVING','LIMIT','OFFSET','FETCH FIRST','DISTINCT',
    'AS','UNION','UNION ALL','INTERSECT','EXCEPT','WITH','RECURSIVE',
    'OVER','PARTITION BY','WINDOW','ROWS','RANGE',
    // Operators
    'AND','OR','NOT','IN','LIKE','ILIKE','BETWEEN','IS NULL','IS NOT NULL','EXISTS',
    'CASE','WHEN','THEN','ELSE','END','ASC','DESC','NULLS FIRST','NULLS LAST',
    // Functions
    'COUNT','SUM','AVG','MIN','MAX','ROUND','ABS','CEIL','CEILING','FLOOR','POWER','SQRT','EXP','LOG',
    'COALESCE','NULLIF','GREATEST','LEAST','IFNULL','ISNULL','NVL','DECODE',
    'UPPER','LOWER','LENGTH','CHAR_LENGTH','SUBSTR','SUBSTRING','LEFT','RIGHT','TRIM','LTRIM','RTRIM',
    'REPLACE','CONCAT','CONCAT_WS','REPEAT','REVERSE','LPAD','RPAD','INSTR','LOCATE','POSITION',
    'CURRENT_DATE','CURRENT_TIME','CURRENT_TIMESTAMP','NOW','DATE','TIME','DATETIME',
    'DATEADD','DATEDIFF','DATE_TRUNC','EXTRACT','YEAR','MONTH','DAY','HOUR','MINUTE','SECOND',
    'STRFTIME','STRPTIME','TO_CHAR','TO_DATE','TO_NUMBER',
    'CAST','CONVERT','TRY_CAST','TRY_CONVERT',
    'ROW_NUMBER','RANK','DENSE_RANK','PERCENT_RANK','NTILE','LAG','LEAD',
    'FIRST_VALUE','LAST_VALUE','NTH_VALUE',
    'JSON_EXTRACT','JSON_OBJECT','JSON_ARRAY','JSON_VALUE','JSON_QUERY',
    // Types
    'INTEGER','INT','BIGINT','SMALLINT','TINYINT','DECIMAL','NUMERIC','REAL','FLOAT',
    'DOUBLE','DOUBLE PRECISION','TEXT','VARCHAR','VARCHAR2','CHAR','NCHAR','NVARCHAR','BLOB','CLOB','BOOLEAN',
    'DATE','TIME','DATETIME','TIMESTAMP','TIMESTAMPTZ','INTERVAL','JSON','JSONB','UUID','XML','ARRAY',
    // Constraints
    'PRIMARY KEY','FOREIGN KEY','UNIQUE','NOT NULL','DEFAULT','CHECK','REFERENCES',
    'AUTOINCREMENT','AUTO_INCREMENT','IDENTITY','CONSTRAINT','INDEX','CASCADE','RESTRICT','NO ACTION',
    // Aggregations
    'GROUP_CONCAT','STRING_AGG','ARRAY_AGG','JSON_AGG',
    // SQLite specific
    'PRAGMA','VACUUM','ANALYZE','ATTACH','DETACH','EXPLAIN','QUERY PLAN',
    'STRICT','WITHOUT ROWID','ON CONFLICT','DO NOTHING','DO UPDATE SET'
];

const SQL_SNIPPETS = [
    { label: 'SELECT', text: 'SELECT ${1:*}\nFROM ${2:table}\nWHERE ${3:condition};', desc: 'Select' },
    { label: 'INSERT', text: 'INSERT INTO ${1:table} (${2:columns})\nVALUES (${3:values});', desc: 'Insert' },
    { label: 'UPDATE', text: 'UPDATE ${1:table}\nSET ${2:col = value}\nWHERE ${3:condition};', desc: 'Update' },
    { label: 'DELETE', text: 'DELETE FROM ${1:table}\nWHERE ${2:condition};', desc: 'Delete' },
    { label: 'CREATE TABLE', text: 'CREATE TABLE ${1:name} (\n    ${2:id} INTEGER PRIMARY KEY,\n    ${3:name} TEXT NOT NULL,\n    ${4:created_at} TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);', desc: 'Create table' },
    { label: 'CREATE INDEX', text: 'CREATE INDEX ${1:idx_name} ON ${2:table} (${3:column});', desc: 'Create index' },
    { label: 'JOIN', text: 'SELECT ${1:a.*}, ${2:b.*}\nFROM ${3:tableA} a\nINNER JOIN ${4:tableB} b ON a.${5:id} = b.${6:a_id}\nWHERE ${7:condition};', desc: 'Inner join' },
    { label: 'LEFT JOIN', text: 'SELECT ${1:*}\nFROM ${2:tableA} a\nLEFT JOIN ${3:tableB} b ON a.${4:id} = b.${5:a_id};', desc: 'Left join' },
    { label: 'GROUP BY', text: 'SELECT ${1:col}, COUNT(*) AS count\nFROM ${2:table}\nGROUP BY ${1:col}\nHAVING COUNT(*) > ${3:1};', desc: 'Group by' },
    { label: 'CTE', text: 'WITH ${1:cte_name} AS (\n    SELECT ${2:*}\n    FROM ${3:table}\n)\nSELECT * FROM ${1:cte_name};', desc: 'Common table expression' },
    { label: 'CASE', text: 'CASE\n    WHEN ${1:condition} THEN ${2:result}\n    ELSE ${3:default}\nEND', desc: 'Case expression' },
    { label: 'UPSERT', text: 'INSERT INTO ${1:table} (${2:cols})\nVALUES (${3:vals})\nON CONFLICT (${4:col}) DO UPDATE SET ${5:col} = excluded.${5:col};', desc: 'Upsert' }
];

const JS_KEYWORDS = [
    // Keywords
    'var','let','const','function','return','if','else','for','while','do','switch',
    'case','default','break','continue','new','delete','typeof','instanceof','void',
    'this','class','extends','super','try','catch','finally','throw','async','await',
    'yield','import','export','from','as','default','in','of','null','undefined',
    'true','false','NaN','Infinity','debugger','static','get','set',
    // Console
    'console.log','console.error','console.warn','console.info','console.debug',
    'console.table','console.dir','console.trace','console.time','console.timeEnd',
    'console.group','console.groupEnd','console.groupCollapsed','console.assert',
    'console.count','console.countReset','console.clear',
    // Objects
    'JSON.parse','JSON.stringify',
    'Object.keys','Object.values','Object.entries','Object.assign','Object.create',
    'Object.freeze','Object.seal','Object.isFrozen','Object.isSealed','Object.isExtensible',
    'Object.defineProperty','Object.defineProperties','Object.getOwnPropertyDescriptor',
    'Object.getOwnPropertyNames','Object.getPrototypeOf','Object.setPrototypeOf',
    'Object.fromEntries','Object.hasOwn',
    // Arrays
    'Array.from','Array.of','Array.isArray',
    'Array.prototype.push','Array.prototype.pop','Array.prototype.shift','Array.prototype.unshift',
    'Array.prototype.slice','Array.prototype.splice','Array.prototype.concat','Array.prototype.join',
    // Globals
    'parseInt','parseFloat','isNaN','isFinite','encodeURIComponent','decodeURIComponent',
    'encodeURI','decodeURI','eval',
    'setTimeout','setInterval','clearTimeout','clearInterval','setImmediate',
    'queueMicrotask','requestAnimationFrame','cancelAnimationFrame',
    'structuredClone','atob','btoa',
    // Promise / async
    'Promise','Promise.resolve','Promise.reject','Promise.all','Promise.allSettled',
    'Promise.race','Promise.any','Promise.withResolvers',
    // Math
    'Math.abs','Math.ceil','Math.floor','Math.round','Math.trunc','Math.sign',
    'Math.max','Math.min','Math.pow','Math.sqrt','Math.cbrt','Math.exp','Math.log',
    'Math.log2','Math.log10','Math.sin','Math.cos','Math.tan','Math.asin','Math.acos',
    'Math.atan','Math.atan2','Math.sinh','Math.cosh','Math.tanh','Math.hypot',
    'Math.PI','Math.E','Math.LN2','Math.LN10','Math.LOG2E','Math.LOG10E','Math.SQRT1_2',
    'Math.SQRT2','Math.random','Math.fround','Math.clz32','Math.imul',
    // Number
    'Number.isInteger','Number.isFinite','Number.isNaN','Number.isSafeInteger',
    'Number.parseInt','Number.parseFloat','Number.MAX_SAFE_INTEGER','Number.MIN_SAFE_INTEGER',
    'Number.MAX_VALUE','Number.MIN_VALUE','Number.EPSILON','Number.POSITIVE_INFINITY',
    // String
    'String.fromCharCode','String.fromCodePoint','String.raw',
    // Date
    'Date.now','Date.parse','Date.UTC',
    // Regex
    'RegExp','Map','Set','WeakMap','WeakSet','WeakRef','Symbol','Proxy','Reflect',
    'Intl','Intl.NumberFormat','Intl.DateTimeFormat','Intl.Collator',
    // Error
    'Error','TypeError','RangeError','SyntaxError','ReferenceError','EvalError','URIError','AggregateError',
    // Methods (common on all objects)
    'length','toString','valueOf','hasOwnProperty','isPrototypeOf','propertyIsEnumerable',
    'toLocaleString','constructor',
    // String methods
    'charAt','charCodeAt','codePointAt','concat','endsWith','includes','indexOf','lastIndexOf',
    'localeCompare','match','matchAll','normalize','padEnd','padStart','repeat','replace',
    'replaceAll','search','slice','split','startsWith','substr','substring','toLowerCase',
    'toUpperCase','trim','trimStart','trimEnd','trimLeft','trimRight','at',
    // Array methods
    'every','filter','find','findIndex','findLast','findLastIndex','flat','flatMap','forEach',
    'map','reduce','reduceRight','some','sort','reverse','fill','copyWithin','entries','keys',
    'values','includes','indexOf','join','pop','push','shift','unshift','slice','splice','at'
];

const JS_SNIPPETS = [
    { label: 'function', text: 'function ${1:name}(${2:args}) {\n    ${3}\n}', desc: 'Function' },
    { label: 'arrow', text: 'const ${1:name} = (${2:args}) => {\n    ${3}\n};', desc: 'Arrow function' },
    { label: 'arrow expression', text: 'const ${1:name} = (${2:args}) => ${3:expression};', desc: 'Arrow expr' },
    { label: 'async fn', text: 'async function ${1:name}(${2:args}) {\n    ${3}\n}', desc: 'Async function' },
    { label: 'async arrow', text: 'const ${1:name} = async (${2:args}) => {\n    ${3}\n};', desc: 'Async arrow' },
    { label: 'class', text: 'class ${1:Name} {\n    constructor(${2:args}) {\n        ${3}\n    }\n}', desc: 'Class' },
    { label: 'if', text: 'if (${1:condition}) {\n    ${2}\n}', desc: 'If' },
    { label: 'if else', text: 'if (${1:condition}) {\n    ${2}\n} else {\n    ${3}\n}', desc: 'If/else' },
    { label: 'for', text: 'for (let ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {\n    ${3}\n}', desc: 'For loop' },
    { label: 'for of', text: 'for (const ${1:item} of ${2:iterable}) {\n    ${3}\n}', desc: 'For of' },
    { label: 'for in', text: 'for (const ${1:key} in ${2:object}) {\n    ${3}\n}', desc: 'For in' },
    { label: 'while', text: 'while (${1:condition}) {\n    ${2}\n}', desc: 'While' },
    { label: 'try', text: 'try {\n    ${1}\n} catch (err) {\n    ${2:console.error(err);}\n}', desc: 'Try/catch' },
    { label: 'try finally', text: 'try {\n    ${1}\n} catch (err) {\n    ${2:console.error(err);}\n} finally {\n    ${3}\n}', desc: 'Try/catch/finally' },
    { label: 'fetch json', text: 'const res = await fetch("${1:url}");\nconst data = await res.json();\n${2:console.log(data);}', desc: 'Fetch JSON' },
    { label: 'fetch post', text: 'const res = await fetch("${1:url}", {\n    method: "POST",\n    headers: { "Content-Type": "application/json" },\n    body: JSON.stringify(${2:data})\n});\nconst result = await res.json();', desc: 'Fetch POST' },
    { label: 'import', text: 'import { ${1:name} } from "${2:module}";', desc: 'Import' },
    { label: 'import default', text: 'import ${1:name} from "${2:module}";', desc: 'Default import' },
    { label: 'export default', text: 'export default ${1:name};', desc: 'Export default' },
    { label: 'promise', text: 'return new Promise((resolve, reject) => {\n    ${1}\n});', desc: 'Promise' },
    { label: 'setTimeout', text: 'setTimeout(() => {\n    ${1}\n}, ${2:1000});', desc: 'setTimeout' },
    { label: 'addEventListener', text: '${1:element}.addEventListener("${2:click}", (e) => {\n    ${3}\n});', desc: 'Event listener' }
];

const CSS_KEYWORDS = [
    // At-rules
    '@media','@import','@keyframes','@font-face','@supports','@charset','@namespace',
    '@layer','@container','@property','@page','@scope',
    // Layout
    'display','position','top','right','bottom','left','inset','width','height',
    'min-width','max-width','min-height','max-height',
    'margin','margin-top','margin-right','margin-bottom','margin-left',
    'margin-inline','margin-block','margin-inline-start','margin-inline-end',
    'padding','padding-top','padding-right','padding-bottom','padding-left',
    'padding-inline','padding-block',
    'float','clear','overflow','overflow-x','overflow-y','overflow-wrap',
    'z-index','visibility','opacity','clip-path','mask','filter',
    // Flexbox / Grid
    'flex','flex-direction','flex-wrap','flex-flow','flex-grow','flex-shrink','flex-basis',
    'justify-content','align-items','align-self','align-content','order','gap',
    'row-gap','column-gap','grid','grid-template','grid-template-areas',
    'grid-template-columns','grid-template-rows','grid-auto-columns','grid-auto-rows',
    'grid-auto-flow','grid-column','grid-row','grid-area','grid-column-start',
    'grid-column-end','grid-row-start','grid-row-end','place-items','place-content',
    'place-self','justify-items','justify-self',
    // Typography
    'font','font-family','font-size','font-weight','font-style','font-variant',
    'font-stretch','line-height','letter-spacing','word-spacing','text-align',
    'text-align-last','text-decoration','text-decoration-line','text-decoration-color',
    'text-decoration-style','text-decoration-thickness','text-indent','text-transform',
    'text-shadow','text-overflow','white-space','word-break','word-wrap','hyphens',
    'vertical-align','direction','unicode-bidi','writing-mode','text-orientation',
    'font-feature-settings','font-kerning','font-optical-sizing','font-variation-settings',
    // Color / background
    'color','background','background-color','background-image','background-repeat',
    'background-position','background-size','background-attachment','background-clip',
    'background-origin','background-blend-mode','mix-blend-mode','isolation',
    // Borders
    'border','border-width','border-style','border-color','border-radius','border-top',
    'border-right','border-bottom','border-left','border-top-width','border-top-style',
    'border-top-color','border-top-left-radius','border-top-right-radius',
    'border-bottom-left-radius','border-bottom-right-radius','border-image',
    'border-collapse','border-spacing','outline','outline-offset','box-shadow',
    // Transforms / animations
    'transform','transform-origin','transform-style','transform-box','translate',
    'rotate','scale','perspective','perspective-origin','backface-visibility',
    'transition','transition-property','transition-duration','transition-timing-function',
    'transition-delay','animation','animation-name','animation-duration',
    'animation-timing-function','animation-delay','animation-iteration-count',
    'animation-direction','animation-fill-mode','animation-play-state','will-change',
    // UI
    'cursor','pointer-events','user-select','resize','appearance','caret-color',
    'accent-color','scroll-behavior','scroll-snap-type','scroll-snap-align',
    'touch-action','object-fit','object-position','aspect-ratio',
    // Box
    'box-sizing','content','quotes','counter-reset','counter-increment',
    'list-style','list-style-type','list-style-position','list-style-image',
    'table-layout','caption-side','empty-cells',
    // Effects
    'backdrop-filter','blur','brightness','contrast','drop-shadow',
    'grayscale','hue-rotate','invert','saturate','sepia',
    // Values
    'absolute','relative','fixed','sticky','static','inherit','initial','unset','revert',
    'block','inline','inline-block','inline-flex','inline-grid',
    'table','table-cell','table-row','none','hidden','visible','collapse',
    'center','left','right','top','bottom','start','end',
    'space-between','space-around','space-evenly','stretch','baseline',
    'wrap','nowrap','wrap-reverse','row','column','row-reverse','column-reverse',
    'solid','dashed','dotted','double','groove','ridge','inset','outset',
    'bold','bolder','lighter','normal','italic','oblique',
    'uppercase','lowercase','capitalize','full-width',
    'ease','ease-in','ease-out','ease-in-out','linear','step-start','step-end',
    'infinite','alternate','alternate-reverse','forwards','backwards','both','paused','running',
    'auto','fit-content','min-content','max-content',
    'pointer','default','grab','grabbing','move','text','wait','help','not-allowed',
    'cover','contain','fill','scale-down','crop','from-image',
    'border-box','content-box','padding-box',
    // Colors
    'transparent','currentColor','black','white','red','green','blue','yellow',
    'orange','purple','pink','gray','grey','brown','cyan','magenta','lime','navy',
    'teal','olive','maroon','silver','aqua','fuchsia'
];

const CSS_SNIPPETS = [
    { label: 'class', text: '.${1:classname} {\n    ${2:property}: ${3:value};\n}', desc: 'Class rule' },
    { label: 'id', text: '#${1:id} {\n    ${2:property}: ${3:value};\n}', desc: 'ID rule' },
    { label: 'flex center', text: 'display: flex;\njustify-content: center;\nalign-items: center;', desc: 'Flex center' },
    { label: 'flex column', text: 'display: flex;\nflex-direction: column;\ngap: ${1:1rem};', desc: 'Flex column' },
    { label: 'grid', text: 'display: grid;\ngrid-template-columns: repeat(${1:3}, 1fr);\ngap: ${2:1rem};', desc: 'Grid layout' },
    { label: 'grid auto', text: 'display: grid;\ngrid-template-columns: repeat(auto-fit, minmax(${1:250px}, 1fr));\ngap: ${2:1rem};', desc: 'Auto grid' },
    { label: 'media', text: '@media (max-width: ${1:768px}) {\n    ${2}\n}', desc: 'Media query' },
    { label: 'media dark', text: '@media (prefers-color-scheme: dark) {\n    ${1}\n}', desc: 'Dark mode' },
    { label: 'keyframes', text: '@keyframes ${1:name} {\n    from { ${2} }\n    to { ${3} }\n}', desc: 'Keyframes' },
    { label: 'transition', text: 'transition: ${1:property} ${2:0.3s} ${3:ease};', desc: 'Transition' },
    { label: 'shadow', text: 'box-shadow: 0 ${1:4px} ${2:6px} rgba(0, 0, 0, ${3:0.1});', desc: 'Box shadow' },
    { label: 'gradient', text: 'background: linear-gradient(${1:135deg}, ${2:#667eea} 0%, ${3:#764ba2} 100%);', desc: 'Gradient' }
];

/* ============================================================
   SECTION 2 — HTML tag database
   ============================================================ */
const HTML_TAGS = [
    { tag: 'html', desc: 'Root element', attrs: ' lang="en"', void: false },
    { tag: 'head', desc: 'Document head', attrs: '', void: false },
    { tag: 'body', desc: 'Document body', attrs: '', void: false },
    { tag: 'title', desc: 'Document title', attrs: '', void: false },
    { tag: 'meta', desc: 'Metadata', attrs: ' charset="UTF-8"', void: true },
    { tag: 'link', desc: 'External resource', attrs: ' rel="stylesheet" href=""', void: true },
    { tag: 'style', desc: 'Inline CSS', attrs: '', void: false },
    { tag: 'script', desc: 'Script', attrs: '', void: false },
    { tag: 'base', desc: 'Base URL', attrs: ' href=""', void: true },
    { tag: 'header', desc: 'Header', attrs: '', void: false },
    { tag: 'footer', desc: 'Footer', attrs: '', void: false },
    { tag: 'nav', desc: 'Navigation', attrs: '', void: false },
    { tag: 'main', desc: 'Main content', attrs: '', void: false },
    { tag: 'section', desc: 'Section', attrs: '', void: false },
    { tag: 'article', desc: 'Article', attrs: '', void: false },
    { tag: 'aside', desc: 'Sidebar', attrs: '', void: false },
    { tag: 'div', desc: 'Block container', attrs: '', void: false },
    { tag: 'h1', desc: 'Heading 1', attrs: '', void: false },
    { tag: 'h2', desc: 'Heading 2', attrs: '', void: false },
    { tag: 'h3', desc: 'Heading 3', attrs: '', void: false },
    { tag: 'h4', desc: 'Heading 4', attrs: '', void: false },
    { tag: 'h5', desc: 'Heading 5', attrs: '', void: false },
    { tag: 'h6', desc: 'Heading 6', attrs: '', void: false },
    { tag: 'p', desc: 'Paragraph', attrs: '', void: false },
    { tag: 'span', desc: 'Inline container', attrs: '', void: false },
    { tag: 'a', desc: 'Hyperlink', attrs: ' href=""', void: false },
    { tag: 'strong', desc: 'Bold', attrs: '', void: false },
    { tag: 'em', desc: 'Emphasis', attrs: '', void: false },
    { tag: 'b', desc: 'Bold', attrs: '', void: false },
    { tag: 'i', desc: 'Italic', attrs: '', void: false },
    { tag: 'u', desc: 'Underline', attrs: '', void: false },
    { tag: 's', desc: 'Strikethrough', attrs: '', void: false },
    { tag: 'small', desc: 'Small', attrs: '', void: false },
    { tag: 'mark', desc: 'Highlighted', attrs: '', void: false },
    { tag: 'sub', desc: 'Subscript', attrs: '', void: false },
    { tag: 'sup', desc: 'Superscript', attrs: '', void: false },
    { tag: 'code', desc: 'Inline code', attrs: '', void: false },
    { tag: 'pre', desc: 'Preformatted', attrs: '', void: false },
    { tag: 'kbd', desc: 'Keyboard', attrs: '', void: false },
    { tag: 'samp', desc: 'Sample output', attrs: '', void: false },
    { tag: 'var', desc: 'Variable', attrs: '', void: false },
    { tag: 'q', desc: 'Quote', attrs: '', void: false },
    { tag: 'blockquote', desc: 'Block quote', attrs: '', void: false },
    { tag: 'cite', desc: 'Citation', attrs: '', void: false },
    { tag: 'abbr', desc: 'Abbreviation', attrs: ' title=""', void: false },
    { tag: 'br', desc: 'Line break', attrs: '', void: true },
    { tag: 'hr', desc: 'Thematic break', attrs: '', void: true },
    { tag: 'wbr', desc: 'Word break', attrs: '', void: true },
    { tag: 'ul', desc: 'Unordered list', attrs: '', void: false },
    { tag: 'ol', desc: 'Ordered list', attrs: '', void: false },
    { tag: 'li', desc: 'List item', attrs: '', void: false },
    { tag: 'dl', desc: 'Description list', attrs: '', void: false },
    { tag: 'dt', desc: 'Description term', attrs: '', void: false },
    { tag: 'dd', desc: 'Description details', attrs: '', void: false },
    { tag: 'img', desc: 'Image', attrs: ' src="" alt=""', void: true },
    { tag: 'picture', desc: 'Picture', attrs: '', void: false },
    { tag: 'source', desc: 'Media source', attrs: ' srcset=""', void: true },
    { tag: 'video', desc: 'Video', attrs: ' controls', void: false },
    { tag: 'audio', desc: 'Audio', attrs: ' controls', void: false },
    { tag: 'track', desc: 'Text track', attrs: '', void: true },
    { tag: 'canvas', desc: 'Canvas', attrs: '', void: false },
    { tag: 'svg', desc: 'SVG root', attrs: ' viewBox="0 0 24 24"', void: false },
    { tag: 'path', desc: 'SVG path', attrs: ' d=""', void: true },
    { tag: 'circle', desc: 'SVG circle', attrs: ' cx="" cy="" r=""', void: false },
    { tag: 'rect', desc: 'SVG rect', attrs: ' x="" y="" width="" height=""', void: false },
    { tag: 'line', desc: 'SVG line', attrs: ' x1="" y1="" x2="" y2=""', void: true },
    { tag: 'polygon', desc: 'SVG polygon', attrs: ' points=""', void: false },
    { tag: 'iframe', desc: 'Inline frame', attrs: ' src=""', void: false },
    { tag: 'embed', desc: 'Embed', attrs: ' src=""', void: true },
    { tag: 'object', desc: 'Object', attrs: ' data=""', void: false },
    { tag: 'table', desc: 'Table', attrs: '', void: false },
    { tag: 'caption', desc: 'Table caption', attrs: '', void: false },
    { tag: 'colgroup', desc: 'Column group', attrs: '', void: false },
    { tag: 'col', desc: 'Column', attrs: '', void: true },
    { tag: 'thead', desc: 'Table head', attrs: '', void: false },
    { tag: 'tbody', desc: 'Table body', attrs: '', void: false },
    { tag: 'tfoot', desc: 'Table foot', attrs: '', void: false },
    { tag: 'tr', desc: 'Table row', attrs: '', void: false },
    { tag: 'th', desc: 'Table header', attrs: '', void: false },
    { tag: 'td', desc: 'Table data', attrs: '', void: false },
    { tag: 'form', desc: 'Form', attrs: ' action="" method="post"', void: false },
    { tag: 'label', desc: 'Label', attrs: ' for=""', void: false },
    { tag: 'input', desc: 'Input', attrs: ' type="text" name=""', void: true },
    { tag: 'textarea', desc: 'Textarea', attrs: ' name=""', void: false },
    { tag: 'button', desc: 'Button', attrs: ' type="button"', void: false },
    { tag: 'select', desc: 'Select', attrs: ' name=""', void: false },
    { tag: 'option', desc: 'Option', attrs: ' value=""', void: false },
    { tag: 'optgroup', desc: 'Option group', attrs: ' label=""', void: false },
    { tag: 'datalist', desc: 'Data list', attrs: '', void: false },
    { tag: 'output', desc: 'Output', attrs: '', void: false },
    { tag: 'progress', desc: 'Progress', attrs: ' value="0" max="100"', void: false },
    { tag: 'meter', desc: 'Meter', attrs: '', void: false },
    { tag: 'fieldset', desc: 'Fieldset', attrs: '', void: false },
    { tag: 'legend', desc: 'Legend', attrs: '', void: false },
    { tag: 'details', desc: 'Disclosure', attrs: '', void: false },
    { tag: 'summary', desc: 'Summary', attrs: '', void: false },
    { tag: 'dialog', desc: 'Dialog', attrs: '', void: false },
    { tag: 'template', desc: 'Template', attrs: '', void: false },
    { tag: 'slot', desc: 'Slot', attrs: '', void: false }
];

const TAG_MAP = {};
HTML_TAGS.forEach(t => { TAG_MAP[t.tag] = t; });
const VOID_TAGS = new Set(HTML_TAGS.filter(t => t.void).map(t => t.tag));

/* Common HTML attributes for suggestion inside tags */
const HTML_ATTRS = [
    'class','id','style','title','lang','dir','hidden','tabindex','accesskey',
    'contenteditable','draggable','spellcheck','translate',
    'href','target','rel','download','ping','referrerpolicy','hreflang','type',
    'src','alt','width','height','loading','decoding','srcset','sizes','crossorigin',
    'action','method','enctype','novalidate','name','value','placeholder','required',
    'disabled','readonly','autocomplete','autofocus','min','max','step','pattern',
    'minlength','maxlength','multiple','accept','capture','form','list','size',
    'checked','selected','rows','cols','wrap','for','formaction','formenctype',
    'formmethod','formnovalidate','formtarget','high','low','optimum','open',
    'colspan','rowspan','headers','scope','cite','datetime','controls','autoplay',
    'loop','muted','preload','poster','kind','srclang','label','default',
    'aria-label','aria-hidden','aria-describedby','aria-labelledby','aria-live',
    'role','data-*'
];

/* ============================================================
   SECTION 3 — Language registry
   ============================================================ */
const LANGS = {
    python: {
        keywords: PY_KEYWORDS,
        modules: PY_MODULES,
        snippets: PY_SNIPPETS,
        trigger: /[A-Za-z_]/,
        word: /[A-Za-z_][\w.]*$/,   // ← 支持模块属性（math.sqrt）
        contexts: ['code']
    },
    c: {
        keywords: C_KEYWORDS,
        headers: C_HEADERS,
        snippets: C_SNIPPETS,
        trigger: /[A-Za-z_#]/,
        word: /[A-Za-z_][\w]*$/,
        contexts: ['code', 'include', 'preprocessor']
    },
    cpp: {
        keywords: CPP_KEYWORDS,
        headers: CPP_HEADERS,
        snippets: CPP_SNIPPETS,
        trigger: /[A-Za-z_#]/,
        word: /[A-Za-z_][\w]*$/,
        contexts: ['code', 'include', 'preprocessor']
    },
    rust: {
        keywords: RUST_KEYWORDS,
        snippets: RUST_SNIPPETS,
        trigger: /[A-Za-z_]/,
        word: /[A-Za-z_][\w!]*$/,
        contexts: ['code']
    },
    go: {
        keywords: GO_KEYWORDS,
        snippets: GO_SNIPPETS,
        trigger: /[A-Za-z_]/,
        word: /[A-Za-z_][\w.]*$/,
        contexts: ['code']
    },
    assembly: {
        keywords: ASM_KEYWORDS,
        snippets: ASM_SNIPPETS,
        trigger: /[A-Za-z_%]/,
        word: /[A-Za-z_%][\w]*$/,
        contexts: ['code']
    },
    lua: {
        keywords: LUA_KEYWORDS,
        snippets: LUA_SNIPPETS,
        trigger: /[A-Za-z_]/,
        word: /[A-Za-z_][\w.]*$/,
        contexts: ['code']
    },
    sql: {
        keywords: SQL_KEYWORDS,
        snippets: SQL_SNIPPETS,
        trigger: /[A-Za-z_]/,
        word: /[A-Za-z_][\w]*$/,
        contexts: ['code'],
        caseInsensitive: true
    },
    javascript: {
        keywords: JS_KEYWORDS,
        snippets: JS_SNIPPETS,
        trigger: /[A-Za-z_$]/,
        word: /[A-Za-z_$][\w$]*$/,
        contexts: ['code']
    },
    css: {
        keywords: CSS_KEYWORDS,
        snippets: CSS_SNIPPETS,
        trigger: /[A-Za-z@-]/,
        word: /[A-Za-z@\-][\w-]*$/,
        contexts: ['code']
    }
};

/* Mode → language key aliases */
const MODE_MAP = {
    'python': 'python',
    'text/x-csrc': 'c',
    'text/x-c': 'c',
    'text/x-c++src': 'cpp',
    'text/x-c++': 'cpp',
    'rust': 'rust',
    'go': 'go',
    'gas': 'assembly',
    'asm': 'assembly',
    'lua': 'lua',
    'sql': 'sql',
    'javascript': 'javascript',
    'jsx': 'javascript',                     // ← 新增
    'text/javascript': 'javascript',
    'application/json': 'javascript',
    'text/typescript': 'javascript',
    'typescript': 'javascript',              // ← 新增
    'application/typescript': 'javascript',  // ← 新增
    'text/jsx': 'javascript',
    'css': 'css',
    'htmlmixed': 'html',
    'xml': 'html',
    'vue': 'html'
};

/* ============================================================
   SECTION 4 — Smart context detection
   ============================================================ */

/**
 * Determine whether the cursor is inside a string literal or comment
 * for the given language. Returns { inString, inComment, inInclude, inTag, inAttribute }.
 */
function detectContext(cm, langKey) {
    const cur = cm.getCursor();
    const line = cm.getLine(cur.line);
    const before = line.slice(0, cur.ch);

    const ctx = {
        inString: false,
        inComment: false,
        inInclude: false,
        inTag: false,
        inAttribute: false
    };

    // --- Line comment check ---
    const lineCommentTokens = {
        python: ['#'],
        c: ['//'],
        cpp: ['//'],
        rust: ['//'],
        go: ['//'],
        assembly: [';'],
        lua: ['--'],
        sql: ['--'],
        javascript: ['//'],
        css: [],
        html: []
    };
    const lcTokens = lineCommentTokens[langKey] || [];
    for (const tok of lcTokens) {
        const idx = before.indexOf(tok);
        if (idx !== -1) {
            const quoteCount = countUnescapedQuotes(before.slice(0, idx));
            if (quoteCount % 2 === 0) {
                ctx.inComment = true;
                return ctx;
            }
        }
    }

    // --- Block comment check (C-family, JS, CSS, Lua --[[ ]]) ---
    const blockOpen = (langKey === 'css') ? '/*'
                    : (langKey === 'html') ? '<!--'
                    : (langKey === 'lua') ? '--[['
                    : '/*';
    const blockClose = (langKey === 'css') ? '*/'
                     : (langKey === 'html') ? '-->'
                     : (langKey === 'lua') ? ']]'
                     : '*/';
    if (['c','cpp','rust','go','javascript','css','html','lua'].includes(langKey)) {
        const doc = cm.getValue();
        const beforeCursor = doc.slice(0, cm.indexFromPos(cur));
        const lastOpen = beforeCursor.lastIndexOf(blockOpen);
        const lastClose = beforeCursor.lastIndexOf(blockClose);
        if (lastOpen > lastClose) {
            ctx.inComment = true;
            return ctx;
        }
    }

    // --- String literal check: char-by-char scan, skip comments ---
    let inStr = false;
    let strChar = null;
    for (let i = 0; i < before.length; i++) {
        const c = before[i];
        if (!inStr) {
            if (c === "'" || c === '"' || c === '`') {
                inStr = true;
                strChar = c;
            }
            // Stop scanning at line-comment token
            if (lcTokens.some(tok => before.startsWith(tok, i))) break;
        } else {
            if (c === '\\') { i++; continue; } // skip escaped char
            if (c === strChar) { inStr = false; strChar = null; }
        }
    }
    if (inStr) ctx.inString = true;

    // --- C/C++ #include context ---
    if (langKey === 'c' || langKey === 'cpp') {
        if (/^\s*#\s*include\s*[<"]/.test(before) && !before.includes('>') && !/["']\s*$/.test(before)) {
            ctx.inInclude = true;
        }
    }

    // --- HTML tag context ---
    if (langKey === 'html') {
        const ltIdx = before.lastIndexOf('<');
        const gtIdx = before.lastIndexOf('>');
        if (ltIdx > gtIdx) {
            ctx.inTag = true;
            const tagContent = before.slice(ltIdx + 1);
            if (/\s/.test(tagContent) && !/^\s/.test(tagContent)) {
                const quoteCount = (tagContent.match(/"/g) || []).length + (tagContent.match(/'/g) || []).length;
                if (quoteCount % 2 === 0) ctx.inAttribute = true;
            }
        }
    }

    return ctx;
}

function countUnescaped(str, ch) {
    let count = 0;
    for (let i = 0; i < str.length; i++) {
        if (str[i] !== ch) continue;
        // Count preceding backslashes; if odd, this char is escaped.
        let bs = 0, j = i - 1;
        while (j >= 0 && str[j] === '\\') { bs++; j--; }
        if (bs % 2 === 0) count++;
    }
    return count;
}
function countUnescapedQuotes(str) {
    return countUnescaped(str, "'") + countUnescaped(str, '"') + countUnescaped(str, '`');
}

/* ============================================================
   SECTION 5 — HTML hint provider
   ============================================================ */
function getTagOpenContext(cm) {
    const cur = cm.getCursor();
    const line = cm.getLine(cur.line);
    const before = line.slice(0, cur.ch);
    const lt = before.lastIndexOf('<');
    if (lt === -1) return null;
    const after = before.slice(lt + 1);
    if (after.includes('>')) return null;
    if (after.startsWith('/')) return null;
    if (!/^[a-zA-Z][a-zA-Z0-9-]*$/.test(after)) return null;
    return { start: { line: cur.line, ch: lt }, partial: after };
}

/* 自定义渲染：标签条目显示为 <name>  +  描述 */
function renderTagHint(el, data) {
    if (data.tagName) {
        const name = document.createElement('span');
        name.className = 'cm-tag-hint-name';
        name.textContent = '<' + data.tagName + '>';
        const desc = document.createElement('span');
        desc.className = 'cm-tag-hint-desc';
        desc.textContent = data.desc || '';
        el.appendChild(name);
        el.appendChild(desc);
    } else {
        el.textContent = data.displayText || data.text;
        if (data.kind === 'attr' || data.kind === 'header') {
            el.classList.add('cm-tag-hint-name');
        }
    }
}

function htmlTagHint(cm) {
    const cur = cm.getCursor();
    const line = cm.getLine(cur.line);
    const before = line.slice(0, cur.ch);

    // --- Attribute suggestion: we're inside a tag ---
    const ltIdx = before.lastIndexOf('<');
    const gtIdx = before.lastIndexOf('>');
    if (ltIdx > gtIdx) {
        const tagContent = before.slice(ltIdx + 1);
        const m = tagContent.match(/([a-zA-Z-]+)\s*=?\s*["'][^"']*$/);
        // If inside an attribute value, don't suggest
        if (m) return null;
        // Match current partial attribute
        const attrMatch = tagContent.match(/([a-zA-Z-]+)$/);
        if (attrMatch) {
            const partial = attrMatch[1].toLowerCase();
            const startCh = cur.ch - partial.length;
            const list = HTML_ATTRS
                .filter(a => a.toLowerCase().startsWith(partial))
                .slice(0, 20)
                .map(a => ({ text: a, displayText: a, kind: 'attr' }));
            if (list.length) {
                return {
                    list,
                    from: { line: cur.line, ch: startCh },
                    to: cur,
                    render: renderTagHint
                };
            }
        }
    }

    // --- Tag name suggestion ---
    const ctx = getTagOpenContext(cm);
    if (!ctx) return null;
    const partial = ctx.partial.toLowerCase();
    const list = HTML_TAGS
        .filter(t => t.tag.startsWith(partial))
        .map(t => ({
            text: `<${t.tag}>`,
            displayText: `<${t.tag}>  ${t.desc}`,
            tagName: t.tag,
            desc: t.desc
        }));
    if (!list.length) return null;

    return {
        list,
        from: { line: ctx.start.line, ch: ctx.start.ch },
        to: cur,
        render: renderTagHint
    };
}

/* ============================================================
   SECTION 6 — Generic language hint provider (smart)
   ============================================================ */
function makeHintProvider(langKey) {
    const lang = LANGS[langKey];
    if (!lang) return null;

    return function (cm) {
        const cur = cm.getCursor();
        const line = cm.getLine(cur.line);
        const before = line.slice(0, cur.ch);
        const ctx = detectContext(cm, langKey);

        // Skip suggestions inside strings or comments
        if (ctx.inString || ctx.inComment) return null;

        // ---- Special case: C/C++ #include <...> ----
        if (ctx.inInclude && lang.headers) {
            const m = before.match(/[<"]([A-Za-z0-9_./]*)$/);
            const partial = m ? m[1] : '';
            const startCh = m ? cur.ch - partial.length : cur.ch;
            const list = lang.headers
                .filter(h => h.startsWith(partial))
                .slice(0, 30)
                .map(h => ({ text: h, displayText: h, kind: 'header' }));
            if (!list.length) return null;
            return {
                list,
                from: { line: cur.line, ch: startCh },
                to: cur,
                render: renderTagHint
            };
        }

        // ---- Normal word context ----
        const wordMatch = before.match(lang.word);
        if (!wordMatch) return null;
        const word = wordMatch[0];
        if (word.length < 1) return null;

        const startCh = cur.ch - word.length;
        const from = { line: cur.line, ch: startCh };

        const wordLower = word.toLowerCase();
        const list = [];

        // ---- 1. Python module attribute: math.sq -> math.sqrt ----
        if (langKey === 'python' && word.includes('.')) {
            const parts = word.split('.');
            const modName = parts[0];
            const attrPartial = parts.slice(1).join('.');
            const mod = PY_MODULES[modName];
            if (mod) {
                const attrLower = attrPartial.toLowerCase();
                mod.forEach(attr => {
                    if (attr.toLowerCase().startsWith(attrLower)) {
                        list.push({
                            text: `${modName}.${attr}`,
                            displayText: `${modName}.${attr}`,
                            kind: 'member'
                        });
                    }
                });
            }
        }

        // ---- 2. Keywords matching ----
        for (const kw of lang.keywords) {
            const kwCmp = lang.caseInsensitive ? kw.toLowerCase() : kw;
            const wordCmp = lang.caseInsensitive ? wordLower : wordLower;

            // exact prefix
            if (kwCmp.toLowerCase().startsWith(wordCmp)) {
                list.push({
                    text: kw,
                    displayText: kw,
                    kind: 'keyword',
                    _rank: kwCmp.toLowerCase() === wordCmp ? 0 :
                           kwCmp.toLowerCase().startsWith(wordCmp) ? 1 : 2
                });
                continue;
            }

            // fuzzy: characters of word appear in order within kw
            if (word.length >= 3 && fuzzyMatch(kwCmp.toLowerCase(), wordCmp)) {
                list.push({
                    text: kw,
                    displayText: kw,
                    kind: 'keyword',
                    _rank: 3
                });
            }
        }

        // ---- 3. Snippets matching ----
        for (const sn of (lang.snippets || [])) {
            const lblLower = sn.label.toLowerCase();
            if (lblLower.startsWith(wordLower)) {
                list.push({
                    text: sn.text,
                    displayText: '⚡ ' + sn.label + '  —  ' + (sn.desc || ''),
                    kind: 'snippet',
                    isSnippet: true,
                    _rank: 0
                });
            } else if (word.length >= 3 && fuzzyMatch(lblLower, wordLower)) {
                list.push({
                    text: sn.text,
                    displayText: '⚡ ' + sn.label + '  —  ' + (sn.desc || ''),
                    kind: 'snippet',
                    isSnippet: true,
                    _rank: 4
                });
            }
        }

        if (!list.length) return null;

        // Dedupe by text
        const seen = new Set();
        const unique = [];
        for (const item of list) {
            const key = item.text + '|' + item.kind;
            if (!seen.has(key)) {
                seen.add(key);
                unique.push(item);
            }
        }

        // Sort: rank asc, then text length asc
        unique.sort((a, b) => {
            const ra = a._rank || 0, rb = b._rank || 0;
            if (ra !== rb) return ra - rb;
            return String(a.text).length - String(b.text).length;
        });

        const trimmed = unique.slice(0, 40);
        trimmed.forEach(h => delete h._rank);

        // For snippets, still use default rendering (CodeMirror will show text).
        // Use default rendering for non-HTML languages.
        return { list: trimmed, from, to: cur };
    };
}

/** Fuzzy: all chars of `needle` appear in `haystack` in order. */
function fuzzyMatch(haystack, needle) {
    let i = 0;
    for (let j = 0; j < haystack.length && i < needle.length; j++) {
        if (haystack[j] === needle[i]) i++;
    }
    return i === needle.length;
}

/* ============================================================
   SECTION 7 — Public API
   ============================================================ */
const providers = {};
Object.keys(LANGS).forEach(name => {
    providers[name] = makeHintProvider(name);
});

window.KeyHints = {
    /** Main entry: get a hint provider for the current CodeMirror mode. */
    providerFor(mode) {
        const key = MODE_MAP[mode] || mode;
        if (key === 'html') return htmlTagHint;
        return providers[key] || null;
    },

    /** Direct HTML tag hint (compat). */
    html: htmlTagHint,

    /** Whether a language is registered. */
    has(langKey) { return !!LANGS[langKey]; },

    /** Get the raw database entry for a language. */
    db(langKey) { return LANGS[langKey]; },

    /** Register a new language at runtime. */
    register(langKey, config) {
        LANGS[langKey] = Object.assign({
            keywords: [], snippets: [], trigger: /[A-Za-z_]/, word: /[A-Za-z_][\w]*$/,
            contexts: ['code']
        }, config);
        providers[langKey] = makeHintProvider(langKey);
    },

    /** Register an alias: mode → langKey. */
    alias(mode, langKey) {
        MODE_MAP[mode] = langKey;
    },

    /** Should the hint widget trigger on this typed character? */
    shouldTrigger(mode, ch) {
        const key = MODE_MAP[mode] || mode;
        if (key === 'html') return ch === '<' || /[a-zA-Z-]/.test(ch);
        const lang = LANGS[key];
        if (!lang) return false;
        return lang.trigger.test(ch);
    },

    /** Helper exports for advanced callers. */
    getTagOpenContext,
    VOID_TAGS,
    TAG_MAP,
    HTML_TAGS,
    HTML_ATTRS
};

})();
