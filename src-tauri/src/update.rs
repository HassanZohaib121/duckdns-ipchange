use tauri::command;

#[command]
pub async fn update_duckdns(
    domain: String,
    token: String,
    ip: String,
) -> Result<String, String> {
    let domain = domain.trim();
    let token = token.trim();
    let ip = ip.trim();

    if domain.is_empty() {
        return Err("DuckDNS domain is required.".to_string());
    }

    if token.is_empty() {
        return Err("DuckDNS token is required.".to_string());
    }

    if ip.is_empty() {
        return Err("IP address is required.".to_string());
    }

    let url = format!(
        "https://www.duckdns.org/update?domains={}&token={}&ip={}",
        domain, token, ip
    );

    println!("Updating DuckDNS for domain: {}", domain);
    println!("IP: {}", ip);

    let response = reqwest::get(&url)
        .await
        .map_err(|e| format!("DuckDNS request failed: {}", e))?;

    if !response.status().is_success() {
        return Err(format!(
            "DuckDNS returned HTTP status: {}",
            response.status()
        ));
    }

    let result = response
        .text()
        .await
        .map_err(|e| format!("Failed to read DuckDNS response: {}", e))?;

    let result = result.trim().to_string();

    println!("DuckDNS response: {}", result);

    match result.as_str() {
        "OK" => Ok(result),

        "KO" => Err(
            "DuckDNS rejected the request. Check your domain and token."
                .to_string(),
        ),

        _ => Err(format!(
            "Unexpected DuckDNS response: {}",
            result
        )),
    }
}