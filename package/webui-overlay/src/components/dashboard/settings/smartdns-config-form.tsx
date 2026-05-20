'use client';

import * as React from 'react';
import {
  Alert,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import RestartAltOutlinedIcon from '@mui/icons-material/RestartAltOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import UndoOutlinedIcon from '@mui/icons-material/UndoOutlined';
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

type NoticeState = { severity: 'success' | 'info' | 'error'; message: string } | null;

const CATEGORY_DEFINITIONS: DirectiveCategory[] = [
  {
    id: 'basic',
    title: '基础配置',
    description: '用于设置服务启动、监听地址、运行用户、路径和基础运行行为。',
  },
  {
    id: 'upstream',
    title: '上游 DNS 服务器',
    description: '配置上游解析服务器、证书信任和代理转发相关参数。',
  },
  {
    id: 'cache',
    title: '缓存与应答',
    description: '调整缓存生命周期、TTL 处理、数量限制和应答策略。',
  },
  {
    id: 'logging',
    title: '日志与审计',
    description: '管理运行日志、审计文件以及调试相关开关。',
  },
  {
    id: 'domainRules',
    title: '域名与分组规则',
    description: '设置域名分流、地址映射、CNAME、规则组和客户端规则。',
  },
  {
    id: 'ipRules',
    title: 'IP 规则与集合',
    description: '管理黑白名单、IPSet、NFTSet、IP 别名以及 ECS 设置。',
  },
  {
    id: 'advanced',
    title: '高级网络配置',
    description: '处理双栈优选、DNS64、本地解析、证书文件和高级插件配置。',
  },
  {
    id: 'webui',
    title: 'WebUI 插件',
    description: '控制 6080 WebUI 插件自身的运行参数和行为。',
  },
  {
    id: 'other',
    title: '其他',
    description: '尚未归类到以上分组的配置指令。',
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

function getDirectiveCategoryId(directiveName: string): string {
  return directiveCategoryMap.get(directiveName) ?? 'other';
}

function buildDirectiveTemplate(directive: SmartdnsConfigSchemaDirective): string {
  switch (directive.kind) {
    case 'boolean': {
      return `${directive.name} yes`;
    }
    case 'integer': {
      return `${directive.name} 0`;
    }
    case 'size': {
      return `${directive.name} 0`;
    }
    case 'enum': {
      return `${directive.name} `;
    }
    default: {
      return `${directive.name} `;
    }
  }
}

function getDirectiveKindLabel(kind: string): string {
  switch (kind) {
    case 'boolean': {
      return '布尔';
    }
    case 'integer': {
      return '整数';
    }
    case 'size': {
      return '尺寸';
    }
    case 'enum': {
      return '枚举';
    }
    case 'string': {
      return '字符串';
    }
    case 'custom': {
      return '自定义';
    }
    default: {
      return kind;
    }
  }
}

function matchesSearch(directive: SmartdnsConfigSchemaDirective, keyword: string): boolean {
  if (!keyword) {
    return true;
  }

  const normalized = keyword.toLowerCase();
  return (
    directive.name.toLowerCase().includes(normalized) ||
    directive.kind.toLowerCase().includes(normalized) ||
    directive.source_macro.toLowerCase().includes(normalized)
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

function insertDirectiveTemplate(
  currentContent: string,
  directiveTemplate: string,
  editor: HTMLTextAreaElement | null
): { nextContent: string; caretPosition: number } {
  const selectionStart = editor?.selectionStart ?? currentContent.length;
  const selectionEnd = editor?.selectionEnd ?? currentContent.length;
  const before = currentContent.slice(0, selectionStart);
  const after = currentContent.slice(selectionEnd);
  const needsLeadingBreak = before.length > 0 && !before.endsWith('\n');
  const needsTrailingBreak = after.length > 0 && !after.startsWith('\n');
  const insertion = `${needsLeadingBreak ? '\n' : ''}${directiveTemplate}${
    needsTrailingBreak ? '\n' : ''
  }`;

  return {
    nextContent: `${before}${insertion}${after}`,
    caretPosition: before.length + insertion.length,
  };
}

export function SmartdnsConfigForm(): React.JSX.Element {
  const { t } = useTranslation();
  const { checkSessionError } = useUser();
  const editorRef = React.useRef<HTMLTextAreaElement | null>(null);

  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isRestarting, setIsRestarting] = React.useState(false);
  const [filePath, setFilePath] = React.useState('');
  const [content, setContent] = React.useState('');
  const [originalContent, setOriginalContent] = React.useState('');
  const [schema, setSchema] = React.useState<SmartdnsConfigSchemaDirective[]>([]);
  const [selectedCategory, setSelectedCategory] = React.useState('basic');
  const [search, setSearch] = React.useState('');
  const [notice, setNotice] = React.useState<NoticeState>(null);

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

    const fileData = fileResponse.data;
    const schemaData = schemaResponse.data;

    setFilePath(fileData?.path ?? schemaData?.path ?? '');
    setContent(fileData?.content ?? '');
    setOriginalContent(fileData?.content ?? '');
    setSchema((schemaData?.directives ?? []).toSorted((left, right) => left.name.localeCompare(right.name)));
    setIsLoading(false);
  }, [apiFetch]);

  React.useEffect(() => {
    void loadConfig();
  }, [loadConfig]);

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
  const isDirty = content !== originalContent;
  const totalVisibleDirectives = categorySummaries.reduce(
    (count, category) => count + category.directives.length,
    0
  );

  const insertTemplate = React.useCallback((directive: SmartdnsConfigSchemaDirective): void => {
    const template = buildDirectiveTemplate(directive);
    const { caretPosition, nextContent } = insertDirectiveTemplate(
      content,
      template,
      editorRef.current
    );

    setContent(nextContent);
    setNotice({
      severity: 'info',
      message: t('已在当前光标位置插入指令模板。'),
    });

    window.requestAnimationFrame(() => {
      editorRef.current?.focus();
      editorRef.current?.setSelectionRange(caretPosition, caretPosition);
    });
  }, [content, t]);

  const copyTemplate = React.useCallback(async (directive: SmartdnsConfigSchemaDirective): Promise<void> => {
    const template = buildDirectiveTemplate(directive);

    try {
      await navigator.clipboard.writeText(template);
      setNotice({ severity: 'success', message: t('指令模板已复制到剪贴板。') });
    } catch {
      setNotice({ severity: 'error', message: t('复制指令模板失败。') });
    }
  }, [t]);

  const resetContent = React.useCallback((): void => {
    setContent(originalContent);
    setNotice({ severity: 'info', message: t('配置内容已恢复到最近一次加载的状态。') });
  }, [originalContent, t]);

  const saveContent = React.useCallback(async (): Promise<void> => {
    setIsSaving(true);
    setNotice(null);

    const response = await apiFetch<null>('/api/config/smartdns/file', {
      method: 'PUT',
      body: JSON.stringify({ content }),
    });

    setIsSaving(false);

    if (response.error) {
      setNotice({ severity: 'error', message: response.error });
      return;
    }

    setOriginalContent(content);
    setNotice({
      severity: 'success',
      message: t('配置文件已保存，服务端已保留 .bak 备份。'),
    });
  }, [apiFetch, content, t]);

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

    setNotice({ severity: 'success', message: t('SmartDNS 重启请求已发送。') });
  }, [checkSessionError, t]);

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Stack alignItems="center" justifyContent="center" spacing={2} sx={{ minHeight: 280 }}>
            <CircularProgress />
            <Typography color="text.secondary" variant="body2">
              {t('正在加载配置页面...')}
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
          subheader={t(
            '可直接编辑 smartdns.conf，按分类浏览全部支持的参数，并通过清晰分区快速完成配置。'
          )}
          title={t('SmartDNS 配置')}
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
                helperText={t('可按指令名、参数类型或来源宏进行筛选。')}
                label={t('搜索指令')}
                onChange={(event) => {
                  setSearch(event.target.value);
                }}
                placeholder={t('输入指令名或类型关键字')}
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
                          primary={t(category.title)}
                          secondary={t(category.description)}
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
                {t(
                  '本页面用于覆盖 smartdns.conf 的全部参数配置。可先从下方模板库插入指令，再在编辑器中按需调整。'
                )}
              </Alert>
            </Stack>

            <Stack spacing={2} sx={{ flex: 1, minWidth: 0 }}>
              <Paper sx={{ borderRadius: 2, p: 2 }} variant="outlined">
                <Stack spacing={1.5}>
                  <Stack spacing={0.75}>
                    <Typography color="text.secondary" variant="overline">
                      {t('当前编辑文件')}
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
                    <Chip label={`${t('全部指令')}: ${schema.length}`} variant="outlined" />
                    <Chip label={`${t('当前可见指令')}: ${totalVisibleDirectives}`} variant="outlined" />
                    <Chip
                      label={`${t('当前分类')}: ${t(currentCategory?.title ?? '其他')}`}
                      variant="outlined"
                    />
                    <Chip
                      label={`${t('模板数量')}: ${currentCategory?.directives.length ?? 0}`}
                      variant="outlined"
                    />
                    <Chip
                      color={isDirty ? 'warning' : 'success'}
                      label={isDirty ? t('有未保存修改') : t('已保存')}
                      variant={isDirty ? 'filled' : 'outlined'}
                    />
                  </Stack>
                </Stack>
              </Paper>

              <Paper sx={{ borderRadius: 2, p: 2 }} variant="outlined">
                <Stack spacing={2}>
                  <Stack spacing={0.5}>
                    <Typography variant="h6">{t('配置文件原文编辑器')}</Typography>
                    <Typography color="text.secondary" variant="body2">
                      {t(
                        '所有 SmartDNS 指令都可以先从模板库插入，再直接在 smartdns.conf 中修改。'
                      )}
                    </Typography>
                  </Stack>

                  <TextField
                    fullWidth
                    helperText={t(
                      '原文模式作为最终配置来源，可确保全部参数都能编辑，同时保留复杂规则的灵活性。'
                    )}
                    inputRef={editorRef}
                    label={t('smartdns.conf 原文')}
                    minRows={24}
                    multiline
                    onChange={(event) => {
                      setContent(event.target.value);
                    }}
                    value={content}
                    sx={{
                      '& .MuiInputBase-input': {
                        fontFamily: '"Roboto Mono", monospace',
                        fontSize: '0.9rem',
                        lineHeight: 1.65,
                      },
                    }}
                  />

                  {notice ? <Alert severity={notice.severity}>{notice.message}</Alert> : null}

                  <CardActions sx={{ justifyContent: 'flex-end', gap: 1, px: 0 }}>
                    <Button
                      onClick={() => {
                        void loadConfig();
                      }}
                      startIcon={<RefreshOutlinedIcon />}
                      variant="text"
                    >
                      {t('重新加载')}
                    </Button>
                    <Button
                      disabled={!isDirty || isSaving}
                      onClick={resetContent}
                      startIcon={<UndoOutlinedIcon />}
                      variant="text"
                    >
                      {t('恢复')}
                    </Button>
                    <Button
                      disabled={isSaving || isRestarting}
                      onClick={() => {
                        void restartServer();
                      }}
                      startIcon={<RestartAltOutlinedIcon />}
                      variant="outlined"
                    >
                      {isRestarting ? t('正在重启...') : t('重启 SmartDNS')}
                    </Button>
                    <Button
                      disabled={!isDirty || isSaving}
                      onClick={() => {
                        void saveContent();
                      }}
                      startIcon={<SaveOutlinedIcon />}
                      variant="contained"
                    >
                      {isSaving ? t('正在保存...') : t('保存配置')}
                    </Button>
                  </CardActions>
                </Stack>
              </Paper>

              <Paper sx={{ borderRadius: 2, p: 2 }} variant="outlined">
                <Stack
                  alignItems={{ xs: 'flex-start', md: 'center' }}
                  direction={{ xs: 'column', md: 'row' }}
                  justifyContent="space-between"
                  spacing={1}
                >
                  <Stack spacing={0.5}>
                    <Typography variant="h6">{t(currentCategory?.title ?? '指令模板库')}</Typography>
                    <Typography color="text.secondary" variant="body2">
                      {t(currentCategory?.description ?? '浏览当前分类中的指令，并插入可直接修改的模板。')}
                    </Typography>
                  </Stack>
                  <Chip
                    color="primary"
                    label={`${currentCategory?.directives.length ?? 0} ${t('个模板')}`}
                    size="small"
                    variant="outlined"
                  />
                </Stack>
              </Paper>

              <Paper sx={{ borderRadius: 2, p: 2 }} variant="outlined">
                <Divider sx={{ mb: 2 }} />

                <Stack spacing={1.25} sx={{ maxHeight: 420, overflowY: 'auto', pr: 0.5 }}>
                  {currentCategory?.directives.length ? (
                    currentCategory.directives.map((directive) => (
                      <Paper key={directive.name} sx={{ borderRadius: 2, p: 1.5 }} variant="outlined">
                        <Stack
                          alignItems={{ xs: 'flex-start', md: 'center' }}
                          direction={{ xs: 'column', md: 'row' }}
                          justifyContent="space-between"
                          spacing={1.5}
                        >
                          <Stack spacing={0.75}>
                            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                              <Typography
                                sx={{ fontFamily: '"Roboto Mono", monospace', fontWeight: 600 }}
                                variant="subtitle2"
                              >
                                {directive.name}
                              </Typography>
                              <Chip label={t(getDirectiveKindLabel(directive.kind))} size="small" variant="outlined" />
                              <Chip label={directive.source_macro} size="small" variant="outlined" />
                            </Stack>
                            <Typography color="text.secondary" variant="caption">
                              {t('模板')}: {buildDirectiveTemplate(directive)}
                            </Typography>
                          </Stack>

                          <Stack direction="row" spacing={1}>
                            <Button
                              onClick={() => {
                                void copyTemplate(directive);
                              }}
                              size="small"
                              startIcon={<ContentCopyOutlinedIcon />}
                              variant="text"
                            >
                              {t('复制')}
                            </Button>
                            <Button
                              onClick={() => {
                                insertTemplate(directive);
                              }}
                              size="small"
                              variant="contained"
                            >
                              {t('插入')}
                            </Button>
                          </Stack>
                        </Stack>
                      </Paper>
                    ))
                  ) : (
                    <Alert severity="info">{t('当前分类或搜索条件下没有匹配到可用指令。')}</Alert>
                  )}
                </Stack>
              </Paper>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
