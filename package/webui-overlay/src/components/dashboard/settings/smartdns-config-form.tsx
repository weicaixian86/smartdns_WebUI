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

const CATEGORY_DEFINITIONS: DirectiveCategory[] = [
  {
    id: 'basic',
    title: '基础配置',
    description: '服务名称、监听地址、运行用户和基础运行行为。',
  },
  {
    id: 'upstream',
    title: '上游 DNS',
    description: '上游 DNS 服务器、TLS/HTTPS/QUIC、代理和证书相关配置。',
  },
  {
    id: 'cache',
    title: '缓存与应答',
    description: '缓存大小、过期应答、TTL 和返回策略。',
  },
  {
    id: 'logging',
    title: '日志与审计',
    description: '日志级别、日志文件、审计文件和调试项。',
  },
  {
    id: 'domainRules',
    title: '域名与分组规则',
    description: '域名路由、地址映射、规则组、客户端规则等。',
  },
  {
    id: 'ipRules',
    title: 'IP 规则与集合',
    description: '黑白名单、IPSet、NFTSet、IP 别名和 ECS。',
  },
  {
    id: 'advanced',
    title: '高级设置',
    description: '双栈优选、DNS64、本地解析、证书文件和插件。',
  },
  {
    id: 'webui',
    title: 'WebUI 插件',
    description: '6080 管理界面的地址、账号、CORS 和终端开关。',
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

const selectOptions: Record<string, string[]> = {
  'response-mode': ['first-ping', 'fastest-ip', 'fastest-response'],
  'log-level': ['off', 'fatal', 'error', 'warn', 'notice', 'info', 'debug'],
};

const placeholders: Record<string, string> = {
  bind: '例如 :6053 或 0.0.0.0:53',
  'bind-tcp': '例如 :6053 或 0.0.0.0:53',
  'bind-tls': '例如 0.0.0.0:853',
  'bind-https': '例如 0.0.0.0:8443',
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
  bind: '支持添加多个监听地址，每行一条。',
  'bind-tcp': '支持添加多个 TCP 监听地址，每行一条。',
  server: '可添加多个上游 UDP/DoH 地址，每行一条。',
  'server-tls': '可添加多个 DoT 地址，每行一条。',
  'server-https': '可添加多个 DoH 地址，每行一条。',
  'server-quic': '可添加多个 DoQ 地址，每行一条。',
  plugin: '插件按行添加，测试 UI 时通常保留 smartdns_ui.so。',
  'smartdns-ui.ip': '填写 WebUI 监听地址，测试时常用 http://0.0.0.0:6080。',
  'smartdns-ui.password': '这里填写 WebUI 登录密码明文，插件会在服务端处理。',
  'response-mode': '请选择返回给客户端的 IP 选择策略。',
  'log-level': '请选择日志输出级别。',
};

function cloneFormState(formState: FormState): FormState {
  return Object.fromEntries(
    Object.entries(formState).map(([key, value]) => [
      key,
      { enabled: value.enabled, values: [...value.values] },
    ])
  );
}

function getDirectiveCategoryId(directiveName: string): string {
  return directiveCategoryMap.get(directiveName) ?? 'other';
}

function isRepeatableDirective(directiveName: string): boolean {
  return repeatableDirectives.has(directiveName);
}

function isSelectDirective(directiveName: string, directiveKind: string): boolean {
  return directiveKind === 'enum' || Object.hasOwn(selectOptions, directiveName);
}

function getSelectOptions(directiveName: string): string[] {
  return selectOptions[directiveName] ?? [];
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
  if (isRepeatableDirective(directive.name)) {
    return { enabled: false, values: [] };
  }

  if (directive.kind === 'boolean') {
    return { enabled: false, values: ['no'] };
  }

  if (isSelectDirective(directive.name, directive.kind)) {
    return { enabled: false, values: [getSelectOptions(directive.name)[0] ?? ''] };
  }

  return { enabled: false, values: [''] };
}

function parseConfigContent(
  content: string,
  schema: SmartdnsConfigSchemaDirective[]
): FormState {
  const directiveLookup = new Set(schema.map((directive) => directive.name));
  const directiveState = Object.fromEntries(
    schema.map((directive) => [directive.name, getDefaultDirectiveState(directive)])
  ) as FormState;

  for (const rawLine of content.split(/\r?\n/)) {
    const trimmedLine = rawLine.trim();

    if (!trimmedLine || trimmedLine.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmedLine.search(/\s/);
    const directiveName =
      separatorIndex === -1 ? trimmedLine : trimmedLine.slice(0, separatorIndex).trim();
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
      directiveState[directiveName] = {
        enabled: true,
        values: [...directiveState[directiveName].values, directiveValue],
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
    if (!directiveValue?.enabled) {
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

function getDirectiveKindLabel(kind: string): string {
  switch (kind) {
    case 'boolean': {
      return '开关';
    }
    case 'integer': {
      return '整数';
    }
    case 'size': {
      return '尺寸';
    }
    case 'enum': {
      return '下拉';
    }
    case 'string': {
      return '文本';
    }
    case 'custom': {
      return '自定义';
    }
    default: {
      return kind;
    }
  }
}

function getDirectiveControlLabel(directive: SmartdnsConfigSchemaDirective): string {
  if (isRepeatableDirective(directive.name)) {
    return '多值输入';
  }

  if (directive.kind === 'boolean') {
    return '滑动开关';
  }

  if (isSelectDirective(directive.name, directive.kind)) {
    return '下拉选项';
  }

  if (directive.kind === 'integer') {
    return '数字输入';
  }

  return '文本输入';
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

    const nextSchema = [...(schemaResponse.data?.directives ?? [])].toSorted((left, right) =>
      left.name.localeCompare(right.name)
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
      directives: schema.filter(
        (directive) =>
          getDirectiveCategoryId(directive.name) === category.id && matchesSearch(directive, search)
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

    setOriginalFormState(cloneFormState(formState));
    setNotice({
      severity: 'success',
      message: '表单配置已保存，服务端已保留 .bak 备份。',
    });
  }, [apiFetch, formState, generatedContent]);

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
    const repeatable = isRepeatableDirective(directive.name);
    const placeholder = placeholders[directive.name] ?? '';
    const helperText =
      helperTexts[directive.name] ??
      (repeatable
        ? '支持多条记录，可通过“新增”按钮继续添加。'
        : directive.kind === 'boolean'
          ? '启用后可通过滑动开关设置 yes / no。'
          : directive.kind === 'size'
            ? '支持填写 128k、1m、1048576 等尺寸值。'
            : directive.kind === 'integer'
              ? '请输入数字。'
              : isSelectDirective(directive.name, directive.kind)
                ? '请选择一个预设选项。'
                : '请输入该参数的值。');

    if (repeatable) {
      const valuesToRender = directiveState.values.length > 0 ? directiveState.values : [''];

      return (
        <Stack spacing={1.25}>
          {valuesToRender.map((value, index) => (
            <Stack key={`${directive.name}-${index}`} direction="row" spacing={1} alignItems="center">
              <TextField
                disabled={!directiveState.enabled}
                fullWidth
                helperText={index === valuesToRender.length - 1 ? helperText : ' '}
                label={`${directive.name} #${index + 1}`}
                onChange={(event) => {
                  updateRepeatableValue(directive, index, event.target.value);
                }}
                placeholder={placeholder}
                value={value}
              />
              <IconButton
                aria-label="删除"
                color="error"
                disabled={!directiveState.enabled}
                onClick={() => {
                  removeRepeatableValue(directive, index);
                }}
              >
                <DeleteOutlineOutlinedIcon />
              </IconButton>
            </Stack>
          ))}
          <Stack direction="row" justifyContent="flex-start">
            <Button
              disabled={!directiveState.enabled}
              onClick={() => {
                addRepeatableValue(directive);
              }}
              size="small"
              startIcon={<AddOutlinedIcon />}
              variant="outlined"
            >
              新增一项
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
                disabled={!directiveState.enabled}
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
          disabled={!directiveState.enabled}
          fullWidth
          helperText={helperText}
          label={directive.name}
          onChange={(event) => {
            updateSingleValue(directive, event.target.value);
          }}
          select
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
        disabled={!directiveState.enabled}
        fullWidth
        helperText={helperText}
        label={directive.name}
        multiline={directive.kind === 'custom' && directiveState.enabled && !placeholder}
        minRows={directive.kind === 'custom' && directiveState.enabled && !placeholder ? 2 : undefined}
        onChange={(event) => {
          updateSingleValue(directive, event.target.value);
        }}
        placeholder={placeholder}
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
          subheader="当前页面采用表单化配置方式。每个参数都可以通过勾选启用、滑动开关、下拉框、输入框或多行输入的形式进行设置。"
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
                这一版设置页以表单为主。多值参数支持新增多行输入，布尔项使用滑动开关，枚举项使用下拉框。
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

              <Stack spacing={2}>
                {currentCategory?.directives.length ? (
                  currentCategory.directives.map((directive) => {
                    const directiveState =
                      formState[directive.name] ?? getDefaultDirectiveState(directive);

                    return (
                      <Paper key={directive.name} sx={{ borderRadius: 2, p: 2 }} variant="outlined">
                        <Stack spacing={2}>
                          <Stack
                            alignItems={{ xs: 'flex-start', md: 'center' }}
                            direction={{ xs: 'column', md: 'row' }}
                            justifyContent="space-between"
                            spacing={1.5}
                          >
                            <Stack spacing={0.75}>
                              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                                <Typography
                                  sx={{ fontFamily: '"Roboto Mono", monospace', fontWeight: 700 }}
                                  variant="subtitle1"
                                >
                                  {directive.name}
                                </Typography>
                                <Chip label={getDirectiveKindLabel(directive.kind)} size="small" variant="outlined" />
                                <Chip label={getDirectiveControlLabel(directive)} size="small" variant="outlined" />
                                <Chip label={directive.source_macro} size="small" variant="outlined" />
                              </Stack>
                              <Typography color="text.secondary" variant="body2">
                                {helperTexts[directive.name] ??
                                  (isRepeatableDirective(directive.name)
                                    ? '该参数支持添加多条记录。'
                                    : directive.kind === 'boolean'
                                      ? '该参数使用开关控制。'
                                      : isSelectDirective(directive.name, directive.kind)
                                        ? '该参数使用下拉框选择。'
                                        : '该参数使用输入框编辑。')}
                              </Typography>
                            </Stack>

                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={directiveState.enabled}
                                  onChange={(_event, checked) => {
                                    updateDirectiveEnabled(directive, checked);
                                  }}
                                />
                              }
                              label="启用该参数"
                            />
                          </Stack>

                          {renderDirectiveControl(directive)}
                        </Stack>
                      </Paper>
                    );
                  })
                ) : (
                  <Alert severity="info">当前分类或搜索条件下没有匹配到参数。</Alert>
                )}
              </Stack>

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
