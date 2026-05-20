"use client";

import * as React from 'react';
import Stack from '@mui/material/Stack';

import { UpdatePasswordForm } from '@/components/dashboard/settings/update-password-form';
import { ChangeLang } from '@/components/dashboard/settings/change-lang';
import { SmartdnsConfigForm } from '@/components/dashboard/settings/smartdns-config-form';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import { Box, Card, CardContent, Tab, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

const tabs = [
  {
    label: 'SmartDNS 配置',
    panel: <SmartdnsConfigForm />,
  },
  {
    label: 'Password',
    panel: <UpdatePasswordForm />,
  },
  {
    label: 'Language',
    panel: <ChangeLang />,
  },
];

export default function SettingsTab(): React.JSX.Element {
  const { t } = useTranslation();
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
                {t('Settings')}
              </Typography>
              <TabList
                allowScrollButtonsMobile
                onChange={handleChange}
                scrollButtons="auto"
                variant="scrollable"
              >
                {tabs.map((tab, index) => (
                  <Tab key={tab.label} label={t(tab.label)} value={index.toString()} />
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
