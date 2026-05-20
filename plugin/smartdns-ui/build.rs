use std::collections::HashSet;
use std::env;
use std::fs;
use std::path::PathBuf;

#[derive(Debug)]
struct IgnoreMacros(HashSet<String>);

impl bindgen::callbacks::ParseCallbacks for IgnoreMacros {
    fn will_parse_macro(&self, name: &str) -> bindgen::callbacks::MacroParsingBehavior {
        if self.0.contains(name) {
            bindgen::callbacks::MacroParsingBehavior::Ignore
        } else {
            bindgen::callbacks::MacroParsingBehavior::Default
        }
    }
}

fn get_git_commit_version() {
    let result = std::process::Command::new("git")
        .args(&["describe", "--tags", "--always", "--dirty"])
        .output();

    let git_version = match result {
        Ok(output) => output.stdout,
        Err(_) => Vec::new(),
    };

    let git_version = String::from_utf8(git_version).expect("Invalid UTF-8 sequence");
    println!("cargo:rustc-env=GIT_VERSION={}", git_version.trim());
}

fn link_rename_lib() {
    /*
    rename the output file to smartdns_ui.so
    */
    let release_plugin = env::var("RELEASE_PLUGIN").is_ok();

    if release_plugin == false {
        // In debug mode, we don't rename the output file
        return;
    }

    let curr_source_dir = env::var("CARGO_MANIFEST_DIR").unwrap();
    let target_dir =
        env::var("CARGO_TARGET_DIR").unwrap_or_else(|_| format!("{}/target", curr_source_dir));
    let crate_name = std::env::var("CARGO_PKG_NAME").unwrap().replace("-", "_");
    let so_path = format!("{}/{}.so", target_dir, crate_name);
    println!("cargo:rustc-link-arg=-o");
    println!("cargo:rustc-link-arg={}", so_path);
}

fn link_smartdns_lib() {
    let curr_source_dir = env::var("CARGO_MANIFEST_DIR").unwrap();
    let smartdns_src_dir = format!("{}/../../src", curr_source_dir);
    let smartdns_inc_dir = format!("{}/include", smartdns_src_dir);
    let smartdns_lib_file = format!("{}/libsmartdns-test.a", smartdns_src_dir);

    let cc = env::var("RUSTC_LINKER")
        .unwrap_or_else(|_| env::var("CC").unwrap_or_else(|_| "cc".to_string()));

    let sysroot_output = std::process::Command::new(&cc)
        .arg("--print-sysroot")
        .output();
    let mut sysroot = None;
    if let Ok(output) = sysroot_output {
        if output.status.success() {
            let path = String::from_utf8(output.stdout).unwrap();
            sysroot = Some(path.trim().to_string());
        }
    }

    let ignored_macros = IgnoreMacros(vec!["IPPORT_RESERVED".into()].into_iter().collect());

    let mut bindings_builder =
        bindgen::Builder::default().header(format!("{}/smartdns/smartdns.h", smartdns_inc_dir));
    if let Some(sysroot) = sysroot {
        bindings_builder = bindings_builder.clang_arg(format!("--sysroot={}", sysroot));
    }
    let bindings = bindings_builder
        .clang_arg(format!("-I{}/include", smartdns_src_dir))
        .parse_callbacks(Box::new(ignored_macros))
        .generate()
        .expect("Unable to generate bindings");

    let out_path = PathBuf::from(env::var("OUT_DIR").unwrap());
    bindings
        .write_to_file(out_path.join("smartdns_bindings.rs"))
        .expect("Couldn't write bindings!");
    /*
    to run tests, please run the following command:
    make test-prepare
    */
    if std::path::Path::new(&smartdns_lib_file).exists() && !cfg!(feature = "build-release") {
        println!("cargo:rerun-if-changed={}", smartdns_lib_file);
        println!("cargo:rustc-link-lib=static=smartdns-test");
        println!("cargo:rustc-link-lib=ssl");
        println!("cargo:rustc-link-lib=crypto");
        println!("cargo:rustc-link-search=native={}", smartdns_src_dir);
    }
}

fn directive_kind_from_macro(macro_name: &str) -> &'static str {
    match macro_name {
        "YESNO" | "YESNO_FUNC" => "boolean",
        "INT" | "INT_FUNC" | "INT_BASE" | "INT_BASE_FUNC" => "integer",
        "STRING" | "STRING_FUNC" => "string",
        "SIZE" | "SIZE_FUNC" | "SSIZE" | "SSIZE_FUNC" => "size",
        "ENUM" | "ENUM_FUNC" => "enum",
        "CUSTOM" => "custom",
        _ => "custom",
    }
}

fn generate_smartdns_conf_schema() {
    let curr_source_dir = env::var("CARGO_MANIFEST_DIR").unwrap();
    let smartdns_conf_file = format!("{}/../../src/dns_conf/dns_conf.c", curr_source_dir);
    println!("cargo:rerun-if-changed={}", smartdns_conf_file);

    let source = fs::read_to_string(&smartdns_conf_file).expect("Unable to read dns_conf.c");
    let mut output = String::from(
        "pub static SMARTDNS_CONFIG_DIRECTIVE_SCHEMA: &[SmartdnsConfigDirectiveSchema] = &[\n",
    );

    let mut in_config_items = false;
    for line in source.lines() {
        let trimmed = line.trim();
        if trimmed.starts_with("static struct config_item _config_item[] = {") {
            in_config_items = true;
            continue;
        }

        if !in_config_items {
            continue;
        }

        if trimmed.starts_with("};") {
            break;
        }

        if !trimmed.starts_with("CONF_") {
            continue;
        }

        if trimmed.starts_with("CONF_END") {
            continue;
        }

        let macro_start = "CONF_".len();
        let Some(paren_index) = trimmed.find('(') else {
            continue;
        };
        let macro_name = &trimmed[macro_start..paren_index];

        let Some(first_quote) = trimmed.find('"') else {
            continue;
        };
        let directive_start = first_quote + 1;
        let Some(second_quote_rel) = trimmed[directive_start..].find('"') else {
            continue;
        };
        let directive_end = directive_start + second_quote_rel;
        let directive_name = &trimmed[directive_start..directive_end];
        let directive_kind = directive_kind_from_macro(macro_name);

        output.push_str("    SmartdnsConfigDirectiveSchema {\n");
        output.push_str(&format!("        name: {:?},\n", directive_name));
        output.push_str(&format!("        kind: {:?},\n", directive_kind));
        output.push_str(&format!("        source_macro: {:?},\n", macro_name));
        output.push_str("    },\n");
    }

    output.push_str("];\n");

    let out_path = PathBuf::from(env::var("OUT_DIR").unwrap());
    fs::write(out_path.join("smartdns_conf_schema.rs"), output)
        .expect("Couldn't write smartdns config schema");
}

fn main() {
    get_git_commit_version();
    link_smartdns_lib();
    generate_smartdns_conf_schema();
    link_rename_lib();
}
