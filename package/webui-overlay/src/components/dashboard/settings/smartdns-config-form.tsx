'use client';

import * as React from 'react';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import RestartAltOutlinedIcon from '@mui/icons-material/RestartAltOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import UndoOutlinedIcon from '@mui/icons-material/UndoOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import {
  Alert,
  Button,
  Card,
  CardContent,
  CardHeader,
  Checkbox,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  FormControlLabel,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

import { useUser } from '@/hooks/use-user';
import { AuthorError, smartdnsServer } from '@/lib/backend/server';

interface SmartdnsConfigFileResponse {
  path: string;
  content: string;
}

interface SmartdnsConfigSchemaDirective {
  name: string;
  kind: string;
  source_macro: string;
}

interface SmartdnsConfigSchemaResponse {
  path: string;
  directive_count: number;
  directives: SmartdnsConfigSchemaDirective[];
}

interface DirectiveCategory {
  id: string;
  title: string;
  description: string;
}

interface DirectiveCategorySummary extends DirectiveCategory {
  directives: SmartdnsConfigSchemaDirective[];
}

interface DirectiveFormState {
  enabled: boolean;
  values: string[];
}

type FormState = Record<string, DirectiveFormState>;
type NoticeState = { severity: 'success' | 'info' | 'error'; message: string } | null;

const directiveAliases = new Map<string, string>([['server-http3', 'server-h3']]);
const hiddenDirectiveNames = new Set<string>(['server-http3']);

const CATEGORY_DEFINITIONS: DirectiveCategory[] = [
  {
    id: 'basic',
    title: '基础设置',
    description: '常用配置：监听、缓存策略与日志级别。',
  },
  {
    id: 'upstream',
    title: '上游 DNS',
    description: '扩展上游 DNS、DoT/DoH/DoQ、代理与证书设置。',
  },
  {
    id: 'cache',
    title: '缓存与应答',
    description: '缓存容量、过期应答、TTL 与返回策略。',
  },
  {
    id: 'logging',
    title: '日志与审计',
    description: '日志级别、日志文件、审计文件与调试开关。',
  },
  {
    id: 'domainRules',
    title: '域名与分组规则',
    description: '域名分流、地址映射、规则组与客户端规则。',
  },
  {
    id: 'ipRules',
    title: 'IP 规则与集合',
    description: '黑白名单、IPSet、NFTSet、IP 别名与 ECS。',
  },
  {
    id: 'advanced',
    title: '高级设置',
    description: '运行方式、双栈优选、DNS64、本地解析和插件。',
  },
  {
    id: 'webui',
    title: 'WebUI 插件',
    description: '6080 管理界面的地址、账号、CORS 与终端开关。',
  },
  {
    id: 'other',
    title: '其他',
    description: '暂未归入以上分类的配置项。',
  },
];

const directiveCategoryMap = new Map<string, string>([
  ['server-name', 'basic'],
  ['resolv-hostname', 'basic'],
  ['bind', 'basic'],
  ['bind-tcp', 'basic'],
  ['bind-tls', 'basic'],
  ['bind-https', 'basic'],
  ['bind-http', 'basic'],
  ['tcp-idle-time', 'basic'],
  ['data-dir', 'basic'],
  ['user', 'basic'],
  ['no-pidfile', 'basic'],
  ['no-daemon', 'basic'],
  ['restart-on-crash', 'basic'],
  ['socket-buff-size', 'basic'],
  ['resolv-file', 'basic'],
  ['server', 'upstream'],
  ['server-tcp', 'upstream'],
  ['server-tls', 'upstream'],
  ['server-https', 'upstream'],
  ['server-h3', 'upstream'],
  ['server-http3', 'upstream'],
  ['server-quic', 'upstream'],
  ['proxy-server', 'upstream'],
  ['ca-file', 'upstream'],
  ['ca-path', 'upstream'],
  ['cache-size', 'cache'],
  ['cache-mem-size', 'cache'],
  ['cache-file', 'cache'],
  ['cache-persist', 'cache'],
  ['cache-checkpoint-time', 'cache'],
  ['prefetch-domain', 'cache'],
  ['serve-expired', 'cache'],
  ['serve-expired-ttl', 'cache'],
  ['serve-expired-reply-ttl', 'cache'],
  ['serve-expired-prefetch-time', 'cache'],
  ['rr-ttl', 'cache'],
  ['rr-ttl-min', 'cache'],
  ['rr-ttl-max', 'cache'],
  ['rr-ttl-reply-max', 'cache'],
  ['local-ttl', 'cache'],
  ['max-reply-ip-num', 'cache'],
  ['max-query-limit', 'cache'],
  ['response-mode', 'cache'],
  ['log-level', 'logging'],
  ['log-file', 'logging'],
  ['log-size', 'logging'],
  ['log-num', 'logging'],
  ['log-color', 'logging'],
  ['log-console', 'logging'],
  ['log-syslog', 'logging'],
  ['log-file-mode', 'logging'],
  ['audit-enable', 'logging'],
  ['audit-SOA', 'logging'],
  ['audit-file', 'logging'],
  ['audit-file-mode', 'logging'],
  ['audit-size', 'logging'],
  ['audit-num', 'logging'],
  ['audit-console', 'logging'],
  ['audit-syslog', 'logging'],
  ['debug-save-fail-packet', 'logging'],
  ['debug-save-fail-packet-dir', 'logging'],
  ['nameserver', 'domainRules'],
  ['address', 'domainRules'],
  ['cname', 'domainRules'],
  ['srv-record', 'domainRules'],
  ['https-record', 'domainRules'],
  ['txt-record', 'domainRules'],
  ['domain-rules', 'domainRules'],
  ['domain-set', 'domainRules'],
  ['ddns-domain', 'domainRules'],
  ['local-domain', 'domainRules'],
  ['group-begin', 'domainRules'],
  ['group-end', 'domainRules'],
  ['group-match', 'domainRules'],
  ['client-rules', 'domainRules'],
  ['ipset-timeout', 'ipRules'],
  ['ipset', 'ipRules'],
  ['ipset-no-speed', 'ipRules'],
  ['nftset-timeout', 'ipRules'],
  ['nftset-debug', 'ipRules'],
  ['nftset', 'ipRules'],
  ['nftset-no-speed', 'ipRules'],
  ['blacklist-ip', 'ipRules'],
  ['whitelist-ip', 'ipRules'],
  ['ip-alias', 'ipRules'],
  ['ip-rules', 'ipRules'],
  ['ip-set', 'ipRules'],
  ['bogus-nxdomain', 'ipRules'],
  ['ignore-ip', 'ipRules'],
  ['edns-client-subnet', 'ipRules'],
  ['mdns-lookup', 'advanced'],
  ['local-ptr-enable', 'advanced'],
  ['expand-ptr-from-address', 'advanced'],
  ['dns64', 'advanced'],
  ['speed-check-mode', 'advanced'],
  ['dualstack-ip-selection', 'advanced'],
  ['dualstack-ip-allow-force-AAAA', 'advanced'],
  ['dualstack-ip-selection-threshold', 'advanced'],
  ['force-AAAA-SOA', 'advanced'],
  ['force-no-CNAME', 'advanced'],
  ['force-qtype-SOA', 'advanced'],
  ['dnsmasq-lease-file', 'advanced'],
  ['odhcpd-lease-file', 'advanced'],
  ['hosts-file', 'advanced'],
  ['acl-enable', 'advanced'],
  ['plugin', 'advanced'],
  ['conf-file', 'advanced'],
  ['bind-cert-root-key-file', 'advanced'],
  ['bind-cert-validity-days', 'advanced'],
  ['bind-cert-file', 'advanced'],
  ['bind-cert-key-file', 'advanced'],
  ['bind-cert-key-pass', 'advanced'],
  ['smartdns-ui.conf-file', 'webui'],
  ['smartdns-ui.www-root', 'webui'],
  ['smartdns-ui.ip', 'webui'],
  ['smartdns-ui.token-expire', 'webui'],
  ['smartdns-ui.max-query-log-age', 'webui'],
  ['smartdns-ui.enable-terminal', 'webui'],
  ['smartdns-ui.enable-cors', 'webui'],
  ['smartdns-ui.user', 'webui'],
  ['smartdns-ui.password', 'webui'],
]);

const repeatableDirectives = new Set<string>([
  'bind',
  'bind-tcp',
  'bind-tls',
  'bind-https',
  'bind-http',
  'server',
  'server-tcp',
  'server-tls',
  'server-https',
  'server-h3',
  'server-http3',
  'server-quic',
  'nameserver',
  'address',
  'cname',
  'srv-record',
  'https-record',
  'txt-record',
  'proxy-server',
  'ipset',
  'ipset-no-speed',
  'nftset',
  'nftset-no-speed',
  'blacklist-ip',
  'whitelist-ip',
  'ip-alias',
  'ip-rules',
  'ip-set',
  'bogus-nxdomain',
  'ignore-ip',
  'edns-client-subnet',
  'domain-rules',
  'domain-set',
  'ddns-domain',
  'local-domain',
  'dns64',
  'group-begin',
  'group-end',
  'group-match',
  'client-rules',
  'plugin',
  'conf-file',
]);

const bootstrapCapableDirectives = new Set<string>([
  'server',
  'server-tcp',
  'server-tls',
  'server-https',
  'server-h3',
  'server-http3',
  'server-quic',
]);

const selectOptions: Record<string, string[]> = {
  'response-mode': ['first-ping', 'fastest-ip', 'fastest-response'],
  'log-level': ['off', 'fatal', 'error', 'warn', 'notice', 'info', 'debug'],
};

const placeholders: Record<string, string> = {
  bind: '例如 :6053 或 0.0.0.0:53',
  'bind-tcp': '例如 :6053 或 0.0.0.0:53',
  'bind-tls': '例如 0.0.0.0:853',
  'bind-https': '例如 0.0.0.0:8443',
  'bind-http': '例如 0.0.0.0:8080',
  server: '例如 223.5.5.5 或 https://dns.google/dns-query',
  'server-tcp': '例如 8.8.8.8:53',
  'server-tls': '例如 1.1.1.1 或 tls://1.1.1.1:853',
  'server-https': '例如 https://dns.google/dns-query',
  'server-h3': '例如 h3://dns.adguard-dns.com:443',
  'server-http3': '例如 h3://dns.adguard-dns.com:443',
  'server-quic': '例如 quic://94.140.14.14:853',
  'proxy-server': '例如 socks5://127.0.0.1:1080 -name proxy',
  'cache-file': '例如 /var/cache/smartdns.cache',
  'data-dir': '例如 /var/lib/smartdns',
  'log-file': '例如 /var/log/smartdns/smartdns.log',
  'audit-file': '例如 /var/log/smartdns/smartdns-audit.log',
  'dnsmasq-lease-file': '例如 /var/lib/misc/dnsmasq.leases',
  'odhcpd-lease-file': '例如 /tmp/hosts/odhcpd',
  'hosts-file': '例如 /etc/hosts',
  'ca-file': '例如 /etc/ssl/certs/ca-certificates.crt',
  'ca-path': '例如 /etc/ssl/certs',
  'smartdns-ui.conf-file': '例如 /etc/smartdns/smartdns.conf',
  'smartdns-ui.www-root': '例如 /usr/share/smartdns/wwwroot',
  'smartdns-ui.ip': '例如 http://0.0.0.0:6080',
  'smartdns-ui.user': '例如 admin',
  'smartdns-ui.password': '例如 password',
  'server-name': '例如 smartdns',
};

const helperTexts: Record<string, string> = {
  'server-name': '用于标识当前 SmartDNS 服务名称。',
  bind: 'UDP 监听地址，可按行添加多个地址。',
  'bind-tcp': 'TCP 监听地址，可按行添加多个地址。',
  'bind-tls': 'TLS 监听地址，启用时需配合证书参数。',
  'bind-https': 'HTTPS 监听地址，启用时需配合证书参数。',
  'bind-http': 'HTTP 监听地址，可按行添加多个地址。',
  server: '上游 DNS 列表，SmartDNS 至少需要一个可用上游；每一项都可单独勾选为 Bootstrap 服务器。',
  'server-tcp': 'TCP 上游 DNS 列表，可按行添加；每一项都可单独勾选为 Bootstrap 服务器。',
  'server-tls': 'TLS 上游 DNS 列表，可按行添加；每一项都可单独勾选为 Bootstrap 服务器。',
  'server-https': 'HTTPS 上游 DNS 列表，可按行添加；每一项都可单独勾选为 Bootstrap 服务器。',
  'server-h3': 'HTTP/3 上游 DNS 列表，可按行添加；每一项都可单独勾选为 Bootstrap 服务器。',
  'server-http3': 'HTTP/3 上游 DNS 列表，可按行添加；每一项都可单独勾选为 Bootstrap 服务器。',
  'server-quic': 'QUIC 上游 DNS 列表，可按行添加；每一项都可单独勾选为 Bootstrap 服务器。',
  'proxy-server': '代理服务器定义，供上游 DNS 通过代理访问。',
  'cache-size': 'DNS 缓存条目数量，0 表示关闭缓存。',
  'cache-mem-size': '限制缓存可使用的内存大小。',
  'cache-persist': '重启后是否保留缓存内容。',
  'cache-checkpoint-time': '缓存落盘周期，单位为秒。',
  'prefetch-domain': '提前刷新热点域名缓存，减少过期等待。',
  'serve-expired': '缓存过期时继续返回旧结果，并后台刷新。',
  'serve-expired-ttl': '缓存过期结果允许继续使用的时长。',
  'serve-expired-reply-ttl': '返回过期缓存时对客户端展示的 TTL。',
  'serve-expired-prefetch-time': '缓存即将过期前提前刷新时机。',
  'response-mode': '控制 SmartDNS 对客户端返回 IP 的优选策略。',
  'log-level': '设置 SmartDNS 的日志输出级别。',
  'log-file': '日志文件路径，启用后会写入磁盘。',
  'audit-enable': '开启后记录 DNS 审计日志。',
  nameserver: '按域名或规则指定上游 DNS 服务器组。',
  address: '按域名返回固定地址或屏蔽结果。',
  cname: '为域名返回固定 CNAME 结果。',
  'domain-rules': '按域名批量应用规则，保持原生 SmartDNS 语法。',
  'group-begin': '定义规则组起始，通常与 group-end 配对使用。',
  'group-end': '结束当前规则组定义。',
  'group-match': '按条件匹配到特定规则组。',
  'client-rules': '按客户端来源地址或 MAC 套用规则。',
  ipset: '将命中域名结果写入 IPSet。',
  nftset: '将命中域名结果写入 NFTSet。',
  'blacklist-ip': '过滤掉不可信或不希望返回的 IP。',
  'whitelist-ip': '仅放行白名单中的 IP 结果。',
  'edns-client-subnet': '向上游附带 ECS 信息，提升地域解析准确性。',
  'dualstack-ip-selection': '双栈网络下是否启用 IPv4/IPv6 优选。',
  'speed-check-mode': '定义 SmartDNS 的测速与优选方式。',
  plugin: '插件按行添加；若要继续使用 6080 管理页，请保留 smartdns_ui.so。',
  'smartdns-ui.conf-file': 'WebUI 读写的 SmartDNS 主配置文件路径。',
  'smartdns-ui.www-root': 'WebUI 静态页面目录，通常无需改动。',
  'smartdns-ui.ip': 'WebUI 监听地址，测试时常用 http://0.0.0.0:6080。',
  'smartdns-ui.token-expire': 'WebUI 登录令牌过期时间，单位为秒。',
  'smartdns-ui.max-query-log-age': '查询日志的最大保留秒数。',
  'smartdns-ui.enable-terminal': '是否允许在 WebUI 中使用终端功能。',
  'smartdns-ui.enable-cors': '是否允许跨域访问 WebUI API。',
  'smartdns-ui.user': 'WebUI 登录用户名。',
  'smartdns-ui.password': '填写 WebUI 登录密码明文，插件会在服务端处理。',
};

const basicCommonDirectives = new Set<string>([
  'server-name',
  'bind',
  'bind-tcp',
  'cache-size',
  'prefetch-domain',
  'serve-expired',
  'response-mode',
  'log-level',
]);

const directiveOrderByCategory: Record<string, string[]> = {
  basic: [
    'server-name',
    'bind',
    'bind-tcp',
    'bind-http',
    'response-mode',
    'cache-size',
    'prefetch-domain',
    'serve-expired',
    'log-level',
  ],
  upstream: [
    'server',
    'server-tcp',
    'server-tls',
    'server-https',
    'server-h3',
    'server-http3',
    'server-quic',
    'proxy-server',
    'ca-file',
    'ca-path',
  ],
  cache: [
    'cache-size',
    'cache-mem-size',
    'cache-persist',
    'cache-file',
    'cache-checkpoint-time',
    'prefetch-domain',
    'serve-expired',
    'serve-expired-ttl',
    'serve-expired-reply-ttl',
    'serve-expired-prefetch-time',
    'rr-ttl',
    'rr-ttl-min',
    'rr-ttl-max',
    'rr-ttl-reply-max',
    'local-ttl',
    'max-reply-ip-num',
    'max-query-limit',
    'response-mode',
  ],
  logging: [
    'log-level',
    'log-file',
    'log-size',
    'log-num',
    'log-color',
    'log-console',
    'log-syslog',
    'log-file-mode',
    'audit-enable',
    'audit-SOA',
    'audit-file',
    'audit-file-mode',
    'audit-size',
    'audit-num',
    'audit-console',
    'audit-syslog',
    'debug-save-fail-packet',
    'debug-save-fail-packet-dir',
  ],
  domainRules: [
    'nameserver',
    'address',
    'cname',
    'srv-record',
    'https-record',
    'txt-record',
    'domain-rules',
    'domain-set',
    'ddns-domain',
    'local-domain',
    'group-begin',
    'group-match',
    'group-end',
    'client-rules',
  ],
  ipRules: [
    'blacklist-ip',
    'whitelist-ip',
    'ignore-ip',
    'bogus-nxdomain',
    'ip-alias',
    'ip-rules',
    'ip-set',
    'ipset-timeout',
    'ipset',
    'ipset-no-speed',
    'nftset-timeout',
    'nftset-debug',
    'nftset',
    'nftset-no-speed',
    'edns-client-subnet',
  ],
  advanced: [
    'resolv-hostname',
    'user',
    'data-dir',
    'resolv-file',
    'tcp-idle-time',
    'socket-buff-size',
    'no-pidfile',
    'no-daemon',
    'restart-on-crash',
    'mdns-lookup',
    'local-ptr-enable',
    'expand-ptr-from-address',
    'speed-check-mode',
    'dualstack-ip-selection',
    'dualstack-ip-allow-force-AAAA',
    'dualstack-ip-selection-threshold',
    'dns64',
    'force-AAAA-SOA',
    'force-no-CNAME',
    'force-qtype-SOA',
    'dnsmasq-lease-file',
    'odhcpd-lease-file',
    'hosts-file',
    'acl-enable',
    'bind-cert-root-key-file',
    'bind-cert-validity-days',
    'bind-cert-file',
    'bind-cert-key-file',
    'bind-cert-key-pass',
    'plugin',
    'conf-file',
  ],
  webui: [
    'smartdns-ui.ip',
    'smartdns-ui.user',
    'smartdns-ui.password',
    'smartdns-ui.enable-terminal',
    'smartdns-ui.enable-cors',
    'smartdns-ui.conf-file',
    'smartdns-ui.www-root',
    'smartdns-ui.token-expire',
    'smartdns-ui.max-query-log-age',
  ],
};

const directiveLabels: Record<string, string> = {
  'server-name': 'DNS 服务名称',
  'resolv-hostname': '解析本机主机名',
  bind: 'UDP 监听地址',
  'bind-tcp': 'TCP 监听地址',
  'bind-tls': 'TLS 监听地址',
  'bind-https': 'HTTPS 监听地址',
  'bind-http': 'HTTP 监听地址',
  'tcp-idle-time': 'TCP 空闲超时',
  'data-dir': '数据目录',
  user: '运行用户',
  'no-pidfile': '不写 PID 文件',
  'no-daemon': '前台运行',
  'restart-on-crash': '崩溃后重启',
  'socket-buff-size': 'Socket 缓冲区',
  'resolv-file': '系统 DNS 文件',
  server: '上游 DNS',
  'server-tcp': '上游 TCP DNS',
  'server-tls': '上游 TLS DNS',
  'server-https': '上游 HTTPS DNS',
  'server-h3': '上游 HTTP/3 DNS',
  'server-http3': '上游 HTTP/3 DNS',
  'server-quic': '上游 QUIC DNS',
  'proxy-server': '代理服务器',
  'ca-file': 'CA 证书文件',
  'ca-path': 'CA 证书目录',
  'cache-size': '缓存大小',
  'cache-mem-size': '缓存内存上限',
  'cache-file': '缓存文件',
  'cache-persist': '持久化缓存',
  'cache-checkpoint-time': '缓存落盘周期',
  'prefetch-domain': '预取热点域名',
  'serve-expired': '返回过期缓存',
  'serve-expired-ttl': '过期缓存保留时长',
  'serve-expired-reply-ttl': '过期应答 TTL',
  'serve-expired-prefetch-time': '过期前预取时间',
  'rr-ttl': '全局 RR TTL',
  'rr-ttl-min': '最小 RR TTL',
  'rr-ttl-max': '最大 RR TTL',
  'rr-ttl-reply-max': '客户端最大回复 TTL',
  'local-ttl': '本地记录 TTL',
  'max-reply-ip-num': '最大返回 IP 数',
  'max-query-limit': '每秒查询上限',
  'response-mode': '返回策略',
  'log-level': '日志级别',
  'log-file': '日志文件',
  'log-size': '单个日志大小',
  'log-num': '日志文件数量',
  'log-color': '彩色日志',
  'log-console': '控制台日志',
  'log-syslog': 'Syslog 日志',
  'log-file-mode': '日志文件权限',
  'audit-enable': '审计日志',
  'audit-SOA': '记录 SOA 审计',
  'audit-file': '审计文件',
  'audit-file-mode': '审计文件权限',
  'audit-size': '单个审计文件大小',
  'audit-num': '审计文件数量',
  'audit-console': '控制台审计',
  'audit-syslog': 'Syslog 审计',
  'debug-save-fail-packet': '保存失败报文',
  'debug-save-fail-packet-dir': '失败报文目录',
  nameserver: 'Nameserver 规则',
  address: '地址映射',
  cname: 'CNAME 映射',
  'srv-record': 'SRV 记录',
  'https-record': 'HTTPS 记录',
  'txt-record': 'TXT 记录',
  'domain-rules': '域名规则',
  'domain-set': '域名集合',
  'ddns-domain': 'DDNS 域名',
  'local-domain': '本地域名',
  'group-begin': '规则组开始',
  'group-end': '规则组结束',
  'group-match': '规则组匹配',
  'client-rules': '客户端规则',
  'ipset-timeout': 'IPSet 超时',
  ipset: 'IPSet 写入',
  'ipset-no-speed': 'IPSet 免测速',
  'nftset-timeout': 'NFTSet 超时',
  'nftset-debug': 'NFTSet 调试',
  nftset: 'NFTSet 写入',
  'nftset-no-speed': 'NFTSet 免测速',
  'blacklist-ip': '黑名单 IP',
  'whitelist-ip': '白名单 IP',
  'ip-alias': 'IP 别名',
  'ip-rules': 'IP 规则',
  'ip-set': 'IP 集合文件',
  'bogus-nxdomain': 'Bogus NXDOMAIN',
  'ignore-ip': '忽略 IP',
  'edns-client-subnet': 'EDNS 客户端子网',
  'mdns-lookup': 'mDNS 查询',
  'local-ptr-enable': '本地 PTR 解析',
  'expand-ptr-from-address': '从地址扩展 PTR',
  dns64: 'DNS64',
  'speed-check-mode': '测速模式',
  'dualstack-ip-selection': '双栈优选',
  'dualstack-ip-allow-force-AAAA': '允许强制 AAAA',
  'dualstack-ip-selection-threshold': '双栈优选阈值',
  'force-AAAA-SOA': '强制 AAAA 返回 SOA',
  'force-no-CNAME': '禁止 CNAME',
  'force-qtype-SOA': '强制指定类型返回 SOA',
  'dnsmasq-lease-file': 'Dnsmasq 租约文件',
  'odhcpd-lease-file': 'Odhcpd 租约文件',
  'hosts-file': 'Hosts 文件',
  'acl-enable': 'ACL 开关',
  plugin: '插件列表',
  'conf-file': '附加配置文件',
  'bind-cert-root-key-file': '根证书私钥',
  'bind-cert-validity-days': '证书有效天数',
  'bind-cert-file': '证书文件',
  'bind-cert-key-file': '证书私钥文件',
  'bind-cert-key-pass': '证书私钥密码',
  'smartdns-ui.conf-file': 'WebUI 配置文件',
  'smartdns-ui.www-root': 'WebUI 页面目录',
  'smartdns-ui.ip': 'WebUI 监听地址',
  'smartdns-ui.token-expire': 'Token 过期秒数',
  'smartdns-ui.max-query-log-age': '查询日志保留秒数',
  'smartdns-ui.enable-terminal': '启用网页终端',
  'smartdns-ui.enable-cors': '启用跨域访问',
  'smartdns-ui.user': 'WebUI 用户名',
  'smartdns-ui.password': 'WebUI 密码',
};

const officialDefaultValues: Record<string, string[]> = {
  bind: ['[::]:53'],
  'resolv-hostname': ['yes'],
  'tcp-idle-time': ['120'],
  'cache-size': ['-1'],
  'cache-mem-size': ['-1'],
  'cache-persist': ['no'],
  'cache-checkpoint-time': ['86400'],
  'response-mode': ['first-ping'],
  'log-level': ['error'],
  'log-size': ['128k'],
  'log-num': ['8'],
  'log-color': ['yes'],
  'audit-file-mode': ['0640'],
  'audit-size': ['128k'],
  'audit-num': ['2'],
  'local-ptr-enable': ['yes'],
  'max-query-limit': ['65535'],
  'resolv-file': ['/etc/resolv.conf'],
  'debug-save-fail-packet-dir': ['/tmp/smartdns'],
  'smartdns-ui.conf-file': ['/etc/smartdns/smartdns.conf'],
  'smartdns-ui.www-root': ['/usr/share/smartdns/wwwroot'],
  'smartdns-ui.ip': ['http://0.0.0.0:6080'],
  'smartdns-ui.token-expire': ['600'],
  'smartdns-ui.max-query-log-age': ['2592000'],
  'smartdns-ui.enable-terminal': ['no'],
  'smartdns-ui.enable-cors': ['no'],
  'smartdns-ui.user': ['admin'],
  'smartdns-ui.password': ['password'],
};

const officialDefaultNotes: Record<string, string> = {
  'server-name': '当前主机名',
  'cache-size': '自动(-1)',
  'cache-mem-size': '自动(-1)',
  'smartdns-ui.max-query-log-age': '2592000(30天)',
};

const requiredDirectives = new Set<string>([
  'server-name',
  'bind',
  'server',
  'plugin',
  'smartdns-ui.conf-file',
  'smartdns-ui.www-root',
  'smartdns-ui.ip',
  'smartdns-ui.user',
  'smartdns-ui.password',
]);

function cloneFormState(formState: FormState): FormState {
  return Object.fromEntries(
    Object.entries(formState).map(([key, value]) => [
      key,
      { enabled: value.enabled, values: [...value.values] },
    ])
  );
}

function getDirectiveCategoryId(directiveName: string): string {
  if (basicCommonDirectives.has(directiveName)) {
    return 'basic';
  }

  const categoryId = directiveCategoryMap.get(directiveName) ?? 'other';
  if (categoryId === 'basic') {
    return 'advanced';
  }

  return categoryId;
}

function sortDirectivesForCategory(
  categoryId: string,
  directives: SmartdnsConfigSchemaDirective[]
): SmartdnsConfigSchemaDirective[] {
  const order = directiveOrderByCategory[categoryId] ?? [];

  return directives.toSorted((left, right) => {
    const leftIndex = order.indexOf(left.name);
    const rightIndex = order.indexOf(right.name);

    if (leftIndex !== -1 || rightIndex !== -1) {
      if (leftIndex === -1) {
        return 1;
      }

      if (rightIndex === -1) {
        return -1;
      }

      if (leftIndex !== rightIndex) {
        return leftIndex - rightIndex;
      }
    }

    return left.name.localeCompare(right.name);
  });
}

function isRepeatableDirective(directiveName: string): boolean {
  return repeatableDirectives.has(directiveName);
}

function isBootstrapCapableDirective(directiveName: string): boolean {
  return bootstrapCapableDirectives.has(directiveName);
}

function normalizeInlineValue(value: string): string {
  return value.trim().replaceAll(/\s{2,}/g, ' ');
}

function parseBootstrapServerValue(raw: string): { value: string; bootstrap: boolean } {
  const bootstrapPattern = /(^|\s+)-(?:bootstrap-dns|b)(?=\s|$)/g;
  const bootstrap = bootstrapPattern.test(raw);
  const value = normalizeInlineValue(raw.replaceAll(bootstrapPattern, ' '));

  return { value, bootstrap };
}

function serializeBootstrapServerValue(value: string, bootstrap: boolean): string {
  const normalizedValue = normalizeInlineValue(value);
  if (!normalizedValue) {
    return '';
  }

  return bootstrap ? `${normalizedValue} -bootstrap-dns` : normalizedValue;
}

function isSelectDirective(directiveName: string, directiveKind: string): boolean {
  return directiveKind === 'enum' || Object.hasOwn(selectOptions, directiveName);
}

function getSelectOptions(directiveName: string): string[] {
  return selectOptions[directiveName] ?? [];
}

function getOfficialDefaultValues(directive: SmartdnsConfigSchemaDirective): string[] | null {
  const values = officialDefaultValues[directive.name];
  if (!values) {
    return null;
  }

  return [...values];
}

function getDirectiveLabel(directiveName: string): string {
  return directiveLabels[directiveName] ?? directiveName;
}

function isDirectiveRequired(directiveName: string): boolean {
  return requiredDirectives.has(directiveName);
}

function normalizeBooleanValue(value: string | undefined): 'yes' | 'no' {
  if (!value) {
    return 'no';
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === 'yes' || normalized === 'true' || normalized === '1' || normalized === 'on') {
    return 'yes';
  }

  return 'no';
}

function getDefaultDirectiveState(directive: SmartdnsConfigSchemaDirective): DirectiveFormState {
  const defaultValues = getOfficialDefaultValues(directive);
  if (defaultValues) {
    return { enabled: isDirectiveRequired(directive.name), values: defaultValues };
  }

  if (isRepeatableDirective(directive.name)) {
    return { enabled: isDirectiveRequired(directive.name), values: [] };
  }

  if (directive.kind === 'boolean') {
    return { enabled: isDirectiveRequired(directive.name), values: ['no'] };
  }

  if (isSelectDirective(directive.name, directive.kind)) {
    return {
      enabled: isDirectiveRequired(directive.name),
      values: [getSelectOptions(directive.name)[0] ?? ''],
    };
  }

  return { enabled: isDirectiveRequired(directive.name), values: [''] };
}

function getDirectiveDefaultNote(directive: SmartdnsConfigSchemaDirective): string {
  if (officialDefaultNotes[directive.name]) {
    return officialDefaultNotes[directive.name];
  }

  const defaultValues = getOfficialDefaultValues(directive);
  if (defaultValues && defaultValues.length > 0) {
    if (directive.kind === 'boolean') {
      return normalizeBooleanValue(defaultValues[0]) === 'yes' ? '开启' : '关闭';
    }

    return defaultValues.join('、');
  }

  if (directive.kind === 'boolean') {
    return '关闭';
  }

  return '';
}

function getDirectiveHelperText(directive: SmartdnsConfigSchemaDirective): string {
  const baseText =
    helperTexts[directive.name] ??
    (isRepeatableDirective(directive.name)
      ? '支持多条记录，可继续新增多行输入。'
      : directive.kind === 'boolean'
        ? '启用后可通过开关写入 yes 或 no。'
        : directive.kind === 'size'
          ? '支持填写 128k、1m、1048576 等尺寸值。'
          : directive.kind === 'integer'
            ? '请输入整数值。'
            : isSelectDirective(directive.name, directive.kind)
              ? '请从下拉列表中选择一个值。'
              : directive.kind === 'custom'
                ? '请按照 SmartDNS 原生参数格式填写完整值。'
                : '请输入该参数的值。');
  const defaultNote = getDirectiveDefaultNote(directive);

  return defaultNote ? `${baseText} 官方默认：${defaultNote}。` : baseText;
}

function normalizeDirectiveName(directiveName: string): string {
  return directiveAliases.get(directiveName) ?? directiveName;
}

function normalizeSchemaDirectives(
  directives: SmartdnsConfigSchemaDirective[]
): SmartdnsConfigSchemaDirective[] {
  return directives.filter((directive) => !hiddenDirectiveNames.has(directive.name));
}

function parseConfigContent(
  content: string,
  schema: SmartdnsConfigSchemaDirective[]
): FormState {
  const directiveLookup = new Set(schema.map((directive) => directive.name));
  const parsedRepeatableDirectives = new Set<string>();
  const directiveState = Object.fromEntries(
    schema.map((directive) => [directive.name, getDefaultDirectiveState(directive)])
  ) as FormState;

  for (const rawLine of content.split(/\r?\n/)) {
    const trimmedLine = rawLine.trim();

    if (!trimmedLine || trimmedLine.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmedLine.search(/\s/);
    const rawDirectiveName =
      separatorIndex === -1 ? trimmedLine : trimmedLine.slice(0, separatorIndex).trim();
    const directiveName = normalizeDirectiveName(rawDirectiveName);
    const directiveValue =
      separatorIndex === -1 ? '' : trimmedLine.slice(separatorIndex).trim();

    if (!directiveLookup.has(directiveName)) {
      continue;
    }

    const schemaDirective = schema.find((directive) => directive.name === directiveName);
    if (!schemaDirective) {
      continue;
    }

    if (isRepeatableDirective(directiveName)) {
      const currentValues = parsedRepeatableDirectives.has(directiveName)
        ? directiveState[directiveName].values
        : [];
      parsedRepeatableDirectives.add(directiveName);
      directiveState[directiveName] = {
        enabled: true,
        values: [...currentValues, directiveValue],
      };
      continue;
    }

    if (schemaDirective.kind === 'boolean') {
      directiveState[directiveName] = {
        enabled: true,
        values: [normalizeBooleanValue(directiveValue)],
      };
      continue;
    }

    directiveState[directiveName] = {
      enabled: true,
      values: [directiveValue],
    };
  }

  for (const directive of schema) {
    if (!isDirectiveRequired(directive.name)) {
      continue;
    }

    const currentState = directiveState[directive.name] ?? getDefaultDirectiveState(directive);
    directiveState[directive.name] = {
      enabled: true,
      values: [...currentState.values],
    };
  }

  return directiveState;
}

function serializeConfigContent(
  formState: FormState,
  schema: SmartdnsConfigSchemaDirective[]
): string {
  const lines: string[] = [
    '# Generated by SmartDNS WebUI form mode.',
    '# 表单模式会按当前启用的参数重新生成配置内容。',
    '',
  ];

  for (const directive of schema) {
    const directiveValue = formState[directive.name];
    if (!directiveValue?.enabled && !isDirectiveRequired(directive.name)) {
      continue;
    }

    if (isRepeatableDirective(directive.name)) {
      for (const value of directiveValue.values.map((item) => item.trim()).filter(Boolean)) {
        lines.push(`${directive.name} ${value}`);
      }
      continue;
    }

    if (directive.kind === 'boolean') {
      lines.push(`${directive.name} ${normalizeBooleanValue(directiveValue.values[0])}`);
      continue;
    }

    const firstValue = (directiveValue.values[0] ?? '').trim();
    if (!firstValue) {
      continue;
    }

    lines.push(`${directive.name} ${firstValue}`);
  }

  return `${lines.join('\n').trimEnd()}\n`;
}

function matchesSearch(directive: SmartdnsConfigSchemaDirective, keyword: string): boolean {
  if (!keyword) {
    return true;
  }

  const normalizedKeyword = keyword.toLowerCase();
  return (
    directive.name.toLowerCase().includes(normalizedKeyword) ||
    directive.kind.toLowerCase().includes(normalizedKeyword) ||
    directive.source_macro.toLowerCase().includes(normalizedKeyword)
  );
}

async function parseErrorMessage(response: Response): Promise<string> {
  const contentType = response.headers.get('Content-Type') ?? '';

  try {
    if (contentType.includes('application/json')) {
      const data = (await response.json()) as { error?: string };
      return data.error ?? 'Request failed.';
    }

    const text = await response.text();
    return text || 'Request failed.';
  } catch {
    return 'Request failed.';
  }
}

export function SmartdnsConfigForm(): React.JSX.Element {
  const { t } = useTranslation();
  const { checkSessionError } = useUser();

  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isRestarting, setIsRestarting] = React.useState(false);
  const [filePath, setFilePath] = React.useState('');
  const [schema, setSchema] = React.useState<SmartdnsConfigSchemaDirective[]>([]);
  const [formState, setFormState] = React.useState<FormState>({});
  const [originalFormState, setOriginalFormState] = React.useState<FormState>({});
  const [selectedCategory, setSelectedCategory] = React.useState('basic');
  const [search, setSearch] = React.useState('');
  const [notice, setNotice] = React.useState<NoticeState>(null);
  const [showPreview, setShowPreview] = React.useState(false);

  const apiFetch = React.useCallback(
    async <T,>(path: string, init?: RequestInit): Promise<{ data?: T; error?: string }> => {
      try {
        const headers = new Headers(init?.headers);
        if (!headers.has('Content-Type')) {
          headers.set('Content-Type', 'application/json');
        }

        const response = await fetch(path, {
          ...init,
          cache: 'no-store',
          credentials: 'include',
          headers,
        });

        if (!response.ok) {
          const message = await parseErrorMessage(response);
          if (response.status === 401) {
            await checkSessionError?.(new AuthorError(message));
          }
          return { error: message };
        }

        if (response.status === 204) {
          return {};
        }

        return { data: (await response.json()) as T };
      } catch (error) {
        return { error: error instanceof Error ? error.message : 'Request failed.' };
      }
    },
    [checkSessionError]
  );

  const loadConfig = React.useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setNotice(null);

    const [fileResponse, schemaResponse] = await Promise.all([
      apiFetch<SmartdnsConfigFileResponse>('/api/config/smartdns/file'),
      apiFetch<SmartdnsConfigSchemaResponse>('/api/config/smartdns/schema'),
    ]);

    if (fileResponse.error) {
      setNotice({ severity: 'error', message: fileResponse.error });
      setIsLoading(false);
      return;
    }

    if (schemaResponse.error) {
      setNotice({ severity: 'error', message: schemaResponse.error });
      setIsLoading(false);
      return;
    }

    const nextSchema = normalizeSchemaDirectives(
      [...(schemaResponse.data?.directives ?? [])].toSorted((left, right) =>
        left.name.localeCompare(right.name)
      )
    );
    const nextFormState = parseConfigContent(fileResponse.data?.content ?? '', nextSchema);

    setFilePath(fileResponse.data?.path ?? schemaResponse.data?.path ?? '');
    setSchema(nextSchema);
    setFormState(nextFormState);
    setOriginalFormState(cloneFormState(nextFormState));
    setIsLoading(false);
  }, [apiFetch]);

  React.useEffect(() => {
    void loadConfig();
  }, [loadConfig]);

  const generatedContent = React.useMemo(() => {
    return serializeConfigContent(formState, schema);
  }, [formState, schema]);

  const categorySummaries = React.useMemo<DirectiveCategorySummary[]>(() => {
    return CATEGORY_DEFINITIONS.map((category) => ({
      ...category,
      directives: sortDirectivesForCategory(
        category.id,
        schema.filter(
          (directive) =>
            getDirectiveCategoryId(directive.name) === category.id &&
            matchesSearch(directive, search)
        )
      ),
    }));
  }, [schema, search]);

  const currentCategory =
    categorySummaries.find((category) => category.id === selectedCategory) ?? categorySummaries[0];
  const enabledDirectiveCount = Object.values(formState).filter((directive) => directive.enabled).length;
  const totalVisibleDirectives = categorySummaries.reduce(
    (count, category) => count + category.directives.length,
    0
  );
  const isDirty = JSON.stringify(formState) !== JSON.stringify(originalFormState);

  const updateDirectiveEnabled = React.useCallback(
    (directive: SmartdnsConfigSchemaDirective, enabled: boolean): void => {
      setFormState((previousState) => {
        const currentState = previousState[directive.name] ?? getDefaultDirectiveState(directive);
        const nextValues =
          enabled && isRepeatableDirective(directive.name) && currentState.values.length === 0
            ? ['']
            : [...currentState.values];

        return {
          ...previousState,
          [directive.name]: {
            enabled,
            values: nextValues,
          },
        };
      });
    },
    []
  );

  const updateSingleValue = React.useCallback(
    (directive: SmartdnsConfigSchemaDirective, value: string): void => {
      setFormState((previousState) => {
        const currentState = previousState[directive.name] ?? getDefaultDirectiveState(directive);
        return {
          ...previousState,
          [directive.name]: {
            enabled: currentState.enabled,
            values: [value],
          },
        };
      });
    },
    []
  );

  const updateRepeatableValue = React.useCallback(
    (directive: SmartdnsConfigSchemaDirective, index: number, value: string): void => {
      setFormState((previousState) => {
        const currentState = previousState[directive.name] ?? getDefaultDirectiveState(directive);
        const nextValues = currentState.values.length > 0 ? [...currentState.values] : [''];
        nextValues[index] = value;

        return {
          ...previousState,
          [directive.name]: {
            enabled: currentState.enabled,
            values: nextValues,
          },
        };
      });
    },
    []
  );

  const addRepeatableValue = React.useCallback((directive: SmartdnsConfigSchemaDirective): void => {
    setFormState((previousState) => {
      const currentState = previousState[directive.name] ?? getDefaultDirectiveState(directive);
      return {
        ...previousState,
        [directive.name]: {
          enabled: true,
          values: [...currentState.values, ''],
        },
      };
    });
  }, []);

  const removeRepeatableValue = React.useCallback(
    (directive: SmartdnsConfigSchemaDirective, index: number): void => {
      setFormState((previousState) => {
        const currentState = previousState[directive.name] ?? getDefaultDirectiveState(directive);
        const nextValues = [...currentState.values];
        nextValues.splice(index, 1);

        return {
          ...previousState,
          [directive.name]: {
            enabled: currentState.enabled,
            values: nextValues,
          },
        };
      });
    },
    []
  );

  const resetForm = React.useCallback((): void => {
    setFormState(cloneFormState(originalFormState));
    setNotice({ severity: 'info', message: '已恢复到最近一次加载的配置状态。' });
  }, [originalFormState]);

  const saveForm = React.useCallback(async (): Promise<void> => {
    setIsSaving(true);
    setNotice(null);

    const response = await apiFetch<null>('/api/config/smartdns/file', {
      method: 'PUT',
      body: JSON.stringify({ content: generatedContent }),
    });

    setIsSaving(false);

    if (response.error) {
      setNotice({ severity: 'error', message: response.error });
      return;
    }

    await loadConfig();
    setNotice({
      severity: 'success',
      message: '表单配置已保存，服务端已保留 .bak 备份。',
    });
  }, [apiFetch, generatedContent, loadConfig]);

  const restartServer = React.useCallback(async (): Promise<void> => {
    setIsRestarting(true);
    setNotice(null);

    const response = await smartdnsServer.RestartServer();
    setIsRestarting(false);

    if (response.error) {
      setNotice({ severity: 'error', message: t(smartdnsServer.getErrorMessage(response.error)) });
      await checkSessionError?.(response.error);
      return;
    }

    setNotice({ severity: 'success', message: 'SmartDNS 重启请求已发送。' });
  }, [checkSessionError, t]);

  const renderDirectiveControl = (directive: SmartdnsConfigSchemaDirective): React.ReactNode => {
    const directiveState = formState[directive.name] ?? getDefaultDirectiveState(directive);
    const required = isDirectiveRequired(directive.name);
    const repeatable = isRepeatableDirective(directive.name);
    const bootstrapCapable = isBootstrapCapableDirective(directive.name);
    const placeholder = placeholders[directive.name] ?? '';
    const helperText = getDirectiveHelperText(directive);

    if (repeatable) {
      const valuesToRender = directiveState.values.length > 0 ? directiveState.values : [''];

      return (
        <Stack spacing={1.25}>
          {valuesToRender.map((rawValue, index) => {
            const parsedValue = bootstrapCapable
              ? parseBootstrapServerValue(rawValue)
              : { value: rawValue, bootstrap: false };

            return (
              <Stack
                key={`${directive.name}-${index}`}
                alignItems={{ xs: 'stretch', md: 'center' }}
                direction={{ xs: 'column', md: 'row' }}
                spacing={1}
              >
                <TextField
                  disabled={!directiveState.enabled && !required}
                  fullWidth
                  helperText={index === valuesToRender.length - 1 ? helperText : ' '}
                  onChange={(event) => {
                    const nextValue = bootstrapCapable
                      ? serializeBootstrapServerValue(event.target.value, parsedValue.bootstrap)
                      : event.target.value;
                    updateRepeatableValue(directive, index, nextValue);
                  }}
                  placeholder={placeholder || `${getDirectiveLabel(directive.name)} 第 ${index + 1} 项`}
                  size="small"
                  value={parsedValue.value}
                />
                {bootstrapCapable ? (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={parsedValue.bootstrap}
                        disabled={!directiveState.enabled && !required}
                        onChange={(_event, checked) => {
                          updateRepeatableValue(
                            directive,
                            index,
                            serializeBootstrapServerValue(parsedValue.value, checked)
                          );
                        }}
                        size="small"
                      />
                    }
                    label="Bootstrap 服务器"
                    labelPlacement="start"
                    sx={{
                      m: 0,
                      flexShrink: 0,
                      alignSelf: { xs: 'flex-start', md: 'center' },
                      '& .MuiFormControlLabel-label': {
                        fontSize: '0.875rem',
                        whiteSpace: 'nowrap',
                      },
                    }}
                  />
                ) : null}
                <IconButton
                  aria-label="删除"
                  color="error"
                  disabled={!directiveState.enabled && !required}
                  onClick={() => {
                    removeRepeatableValue(directive, index);
                  }}
                >
                  <DeleteOutlineOutlinedIcon />
                </IconButton>
              </Stack>
            );
          })}
          <Stack direction="row" justifyContent="flex-start">
            <Button
              disabled={!directiveState.enabled && !required}
              onClick={() => {
                addRepeatableValue(directive);
              }}
              size="small"
              startIcon={<AddOutlinedIcon />}
              variant="outlined"
            >
              新增
            </Button>
          </Stack>
        </Stack>
      );
    }

    if (directive.kind === 'boolean') {
      const checked = normalizeBooleanValue(directiveState.values[0]) === 'yes';

      return (
        <Stack spacing={0.5}>
          <FormControlLabel
            control={
              <Switch
                checked={checked}
                disabled={!directiveState.enabled && !required}
                onChange={(_event, nextChecked) => {
                  updateSingleValue(directive, nextChecked ? 'yes' : 'no');
                }}
              />
            }
            label={checked ? '已开启' : '已关闭'}
          />
          <Typography color="text.secondary" variant="caption">
            {helperText}
          </Typography>
        </Stack>
      );
    }

    if (isSelectDirective(directive.name, directive.kind)) {
      const options = getSelectOptions(directive.name);

      return (
        <TextField
          disabled={!directiveState.enabled && !required}
          fullWidth
          helperText={helperText}
          onChange={(event) => {
            updateSingleValue(directive, event.target.value);
          }}
          placeholder={placeholder}
          select
          size="small"
          value={directiveState.values[0] ?? ''}
        >
          {options.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>
      );
    }

    return (
      <TextField
        disabled={!directiveState.enabled && !required}
        fullWidth
        helperText={helperText}
        multiline={directive.kind === 'custom' && directiveState.enabled && !placeholder}
        minRows={directive.kind === 'custom' && directiveState.enabled && !placeholder ? 2 : undefined}
        onChange={(event) => {
          updateSingleValue(directive, event.target.value);
        }}
        placeholder={placeholder}
        size="small"
        type={directive.kind === 'integer' ? 'number' : 'text'}
        value={directiveState.values[0] ?? ''}
      />
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Stack alignItems="center" justifyContent="center" spacing={2} sx={{ minHeight: 280 }}>
            <CircularProgress />
            <Typography color="text.secondary" variant="body2">
              正在加载 SmartDNS 表单配置页面...
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  return (
    <Stack spacing={3}>
      <Card>
        <CardHeader
          subheader="基础设置聚合常用参数；其余参数预填官方默认值，并使用更紧凑的表单行方式展示。"
          title="SmartDNS 配置"
        />
        <Divider />
        <CardContent>
          <Stack alignItems="flex-start" direction={{ xs: 'column', xl: 'row' }} spacing={3}>
            <Stack
              spacing={2}
              sx={{
                width: { xs: '100%', xl: 320 },
                flexShrink: 0,
                position: { xl: 'sticky' },
                top: { xl: 24 },
              }}
            >
              <TextField
                fullWidth
                helperText="可按参数名、参数类型或来源宏进行筛选。"
                label="搜索参数"
                onChange={(event) => {
                  setSearch(event.target.value);
                }}
                placeholder="输入参数名或类型关键字"
                value={search}
              />

              <Paper sx={{ borderRadius: 2, overflow: 'hidden' }} variant="outlined">
                <List
                  disablePadding
                  sx={{
                    maxHeight: { xl: 'calc(100vh - 260px)' },
                    overflowY: 'auto',
                  }}
                >
                  {categorySummaries.map((category, index) => (
                    <React.Fragment key={category.id}>
                      <ListItemButton
                        onClick={() => {
                          setSelectedCategory(category.id);
                        }}
                        selected={selectedCategory === category.id}
                      >
                        <ListItemText
                          primary={category.title}
                          secondary={category.description}
                          primaryTypographyProps={{ variant: 'subtitle2' }}
                          secondaryTypographyProps={{ variant: 'caption' }}
                        />
                        <Chip
                          color={selectedCategory === category.id ? 'primary' : 'default'}
                          label={category.directives.length}
                          size="small"
                          variant={selectedCategory === category.id ? 'filled' : 'outlined'}
                        />
                      </ListItemButton>
                      {index < categorySummaries.length - 1 ? <Divider component="li" /> : null}
                    </React.Fragment>
                  ))}
                </List>
              </Paper>

              <Alert severity="info">
                这一版设置页采用紧凑表单布局。基础设置聚合常用参数，其余字段显示中文注释并预填官方默认值。
              </Alert>
            </Stack>

            <Stack spacing={2} sx={{ flex: 1, minWidth: 0 }}>
              <Paper sx={{ borderRadius: 2, p: 2 }} variant="outlined">
                <Stack spacing={1.5}>
                  <Stack spacing={0.75}>
                    <Typography color="text.secondary" variant="overline">
                      当前编辑文件
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: '"Roboto Mono", monospace',
                        fontSize: '0.95rem',
                        wordBreak: 'break-all',
                      }}
                      variant="body2"
                    >
                      {filePath || '-'}
                    </Typography>
                  </Stack>
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} useFlexGap flexWrap="wrap">
                    <Chip label={`全部参数: ${schema.length}`} variant="outlined" />
                    <Chip label={`当前分类可见: ${totalVisibleDirectives}`} variant="outlined" />
                    <Chip label={`当前分类: ${currentCategory?.title ?? '其他'}`} variant="outlined" />
                    <Chip label={`已启用参数: ${enabledDirectiveCount}`} variant="outlined" />
                    <Chip
                      color={isDirty ? 'warning' : 'success'}
                      label={isDirty ? '有未保存修改' : '已保存'}
                      variant={isDirty ? 'filled' : 'outlined'}
                    />
                  </Stack>
                </Stack>
              </Paper>

              <Paper sx={{ borderRadius: 2, p: 2 }} variant="outlined">
                <Stack
                  alignItems={{ xs: 'flex-start', md: 'center' }}
                  direction={{ xs: 'column', md: 'row' }}
                  justifyContent="space-between"
                  spacing={1.5}
                >
                  <Stack spacing={0.5}>
                    <Typography variant="h6">{currentCategory?.title ?? '参数配置'}</Typography>
                    <Typography color="text.secondary" variant="body2">
                      {currentCategory?.description ?? '请选择一个分类后配置对应参数。'}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                    <Button
                      onClick={() => {
                        void loadConfig();
                      }}
                      startIcon={<RefreshOutlinedIcon />}
                      variant="text"
                    >
                      重新加载
                    </Button>
                    <Button
                      disabled={!isDirty || isSaving}
                      onClick={resetForm}
                      startIcon={<UndoOutlinedIcon />}
                      variant="text"
                    >
                      恢复
                    </Button>
                    <Button
                      disabled={isSaving || isRestarting}
                      onClick={() => {
                        void restartServer();
                      }}
                      startIcon={<RestartAltOutlinedIcon />}
                      variant="outlined"
                    >
                      {isRestarting ? '正在重启...' : '重启 SmartDNS'}
                    </Button>
                    <Button
                      disabled={!isDirty || isSaving}
                      onClick={() => {
                        void saveForm();
                      }}
                      startIcon={<SaveOutlinedIcon />}
                      variant="contained"
                    >
                      {isSaving ? '正在保存...' : '保存配置'}
                    </Button>
                  </Stack>
                </Stack>
              </Paper>

              {notice ? <Alert severity={notice.severity}>{notice.message}</Alert> : null}

              {currentCategory?.directives.length ? (
                <Paper sx={{ borderRadius: 2, overflow: 'hidden' }} variant="outlined">
                  <Stack divider={<Divider flexItem />} spacing={0}>
                    {currentCategory.directives.map((directive) => {
                      const directiveState =
                        formState[directive.name] ?? getDefaultDirectiveState(directive);
                      const required = isDirectiveRequired(directive.name);

                      return (
                        <Stack
                          key={directive.name}
                          direction={{ xs: 'column', lg: 'row' }}
                          spacing={2}
                          sx={{ px: 2, py: 2 }}
                        >
                          <Stack
                            spacing={0.35}
                            sx={{
                              width: { xs: '100%', lg: 168 },
                              flexShrink: 0,
                              pt: { lg: 0.75 },
                            }}
                          >
                            <Typography sx={{ fontSize: '1rem', fontWeight: 700, lineHeight: 1.5 }} variant="subtitle1">
                              {getDirectiveLabel(directive.name)}
                            </Typography>
                            <Typography
                              color="text.secondary"
                              sx={{ fontFamily: '"Roboto Mono", monospace' }}
                              variant="caption"
                            >
                              {directive.name}
                            </Typography>
                          </Stack>

                          <Stack spacing={1} sx={{ flex: 1, minWidth: 0 }}>
                            <Stack
                              alignItems={{ xs: 'stretch', md: 'flex-start' }}
                              direction={{ xs: 'column', md: 'row' }}
                              spacing={1.25}
                            >
                              <Stack sx={{ flex: 1, minWidth: 0 }}>
                                {renderDirectiveControl(directive)}
                              </Stack>

                              {required ? null : (
                                <FormControlLabel
                                  control={
                                    <Checkbox
                                      checked={directiveState.enabled}
                                      onChange={(_event, checked) => {
                                        updateDirectiveEnabled(directive, checked);
                                      }}
                                      size="small"
                                    />
                                  }
                                  label="启用"
                                  sx={{
                                    m: 0,
                                    flexShrink: 0,
                                    alignSelf: { xs: 'flex-end', md: 'flex-start' },
                                    pt: { md: 0.25 },
                                    '& .MuiFormControlLabel-label': {
                                      whiteSpace: 'nowrap',
                                    },
                                  }}
                                />
                              )}
                            </Stack>
                          </Stack>
                        </Stack>
                      );
                    })}
                  </Stack>
                </Paper>
              ) : (
                <Alert severity="info">当前分类或搜索条件下没有匹配到参数。</Alert>
              )}

              <Paper sx={{ borderRadius: 2, p: 2 }} variant="outlined">
                <Stack
                  alignItems={{ xs: 'flex-start', md: 'center' }}
                  direction={{ xs: 'column', md: 'row' }}
                  justifyContent="space-between"
                  spacing={1.5}
                >
                  <Stack spacing={0.5}>
                    <Typography variant="h6">生成后的配置预览</Typography>
                    <Typography color="text.secondary" variant="body2">
                      表单保存时会按当前内容生成 smartdns.conf，可在这里预览最终写入结果。
                    </Typography>
                  </Stack>
                  <Button
                    onClick={() => {
                      setShowPreview((previousState) => !previousState);
                    }}
                    startIcon={showPreview ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                    variant="text"
                  >
                    {showPreview ? '隐藏预览' : '显示预览'}
                  </Button>
                </Stack>

                <Collapse in={showPreview}>
                  <TextField
                    fullWidth
                    inputProps={{ readOnly: true }}
                    label="smartdns.conf 预览"
                    minRows={16}
                    multiline
                    sx={{
                      mt: 2,
                      '& .MuiInputBase-input': {
                        fontFamily: '"Roboto Mono", monospace',
                        fontSize: '0.9rem',
                        lineHeight: 1.6,
                      },
                    }}
                    value={generatedContent}
                  />
                </Collapse>
              </Paper>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
