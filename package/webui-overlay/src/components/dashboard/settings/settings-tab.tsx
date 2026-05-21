"use client";

import * as React from 'react';
import Stack from '@mui/material/Stack';

import { ChangeLang } from '@/components/dashboard/settings/change-lang';
import { SmartdnsConfigForm } from '@/components/dashboard/settings/smartdns-config-form';
import { UpdatePasswordForm } from '@/components/dashboard/settings/update-password-form';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import { Box, Card, CardContent, Tab, Typography } from '@mui/material';

const tabs = [
  {
    label: 'SmartDNS 配置',
    panel: <SmartdnsConfigForm />,
  },
  {
    label: '登录密码',
    panel: <UpdatePasswordForm />,
  },
  {
    label: '语言',
    panel: <ChangeLang />,
  },
];

export default function SettingsTab(): React.JSX.Element {
  const [value, setValue] = React.useState('0');

  const handleChange = (_event: React.SyntheticEvent, newValue: string): void => {
    setValue(newValue);
  };

  return (
    <Stack spacing={1}>
      <Card>
        <TabContext value={value}>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ px: 3, pt: 3, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="h5" sx={{ mb: 2 }}>
                设置
              </Typography>
              <TabList
                allowScrollButtonsMobile
                onChange={handleChange}
                scrollButtons="auto"
                variant="scrollable"
              >
                {tabs.map((tab, index) => (
                  <Tab key={tab.label} label={tab.label} value={index.toString()} />
                ))}
              </TabList>
            </Box>
            {tabs.map((tab, index) => (
              <TabPanel key={tab.label} sx={{ p: 3 }} value={index.toString()}>
                {tab.panel}
              </TabPanel>
            ))}
          </CardContent>
        </TabContext>
      </Card>
    </Stack>
  );
}
