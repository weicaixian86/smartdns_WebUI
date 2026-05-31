<<<<<<< Updated upstream
/*************************************************************************
 *
 * Copyright (C) 2018-2025 Ruilin Peng (Nick) <pymumu@gmail.com>.
 *
 * smartdns is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * smartdns is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

#[derive(Clone, Copy)]
pub struct SmartdnsConfigDirectiveSchema {
    pub name: &'static str,
    pub kind: &'static str,
    pub source_macro: &'static str,
}

include!(concat!(env!("OUT_DIR"), "/smartdns_conf_schema.rs"));

pub fn get_smartdns_config_schema() -> &'static [SmartdnsConfigDirectiveSchema] {
    SMARTDNS_CONFIG_DIRECTIVE_SCHEMA
}

pub static SMARTDNS_UI_PLUGIN_DIRECTIVE_SCHEMA: &[SmartdnsConfigDirectiveSchema] = &[
    SmartdnsConfigDirectiveSchema {
        name: "smartdns-ui.conf-file",
        kind: "string",
        source_macro: "PLUGIN",
    },
    SmartdnsConfigDirectiveSchema {
        name: "smartdns-ui.www-root",
        kind: "string",
        source_macro: "PLUGIN",
    },
    SmartdnsConfigDirectiveSchema {
        name: "smartdns-ui.ip",
        kind: "string",
        source_macro: "PLUGIN",
    },
    SmartdnsConfigDirectiveSchema {
        name: "smartdns-ui.token-expire",
        kind: "integer",
        source_macro: "PLUGIN",
    },
    SmartdnsConfigDirectiveSchema {
        name: "smartdns-ui.max-query-log-age",
        kind: "integer",
        source_macro: "PLUGIN",
    },
    SmartdnsConfigDirectiveSchema {
        name: "smartdns-ui.enable-terminal",
        kind: "boolean",
        source_macro: "PLUGIN",
    },
    SmartdnsConfigDirectiveSchema {
        name: "smartdns-ui.enable-cors",
        kind: "boolean",
        source_macro: "PLUGIN",
    },
    SmartdnsConfigDirectiveSchema {
        name: "smartdns-ui.user",
        kind: "string",
        source_macro: "PLUGIN",
    },
    SmartdnsConfigDirectiveSchema {
        name: "smartdns-ui.password",
        kind: "string",
        source_macro: "PLUGIN",
    },
];

pub fn get_all_smartdns_config_schema() -> Vec<SmartdnsConfigDirectiveSchema> {
    let mut directives = SMARTDNS_CONFIG_DIRECTIVE_SCHEMA.to_vec();
    directives.extend_from_slice(SMARTDNS_UI_PLUGIN_DIRECTIVE_SCHEMA);
    directives
}
=======
use crate::http_api_msg::SmartdnsConfigDirective;

include!(concat!(env!("OUT_DIR"), "/smartdns_conf_schema.rs"));
>>>>>>> Stashed changes
