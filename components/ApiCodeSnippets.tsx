
import React, { useState, useMemo } from 'react';
import { Box, Tabs, Tab, IconButton, Tooltip, Paper, Typography } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import { generateExampleFromSchema } from './apiSpecUtils';

const API_BASE_URL = 'https://localizationpro-api.tnl.one';

const generateCurlSnippet = (path: string, method: string, details: any, spec: any) => {
    let curl = `curl -X ${method.toUpperCase()} "${API_BASE_URL}/api/v1${path}" \\`;
    
    const headers = { 'Content-Type': 'application/json' };
    for (const [key, value] of Object.entries(headers)) {
        curl += `\n  -H "${key}: ${value}" \\`;
    }

    if (details.requestBody) {
        const schema = details.requestBody.content['application/json'].schema;
        const example = generateExampleFromSchema(schema, spec);
        curl += `\n  -d '${JSON.stringify(example, null, 2)}'`;
    } else {
        curl = curl.slice(0, -2); // Remove trailing backslash
    }

    return curl;
};

const generateJsSnippet = (path: string, method: string, details: any, spec: any) => {
    let js = `const url = "${API_BASE_URL}/api/v1${path}";\n`;
    const options: any = {
        method: method.toUpperCase(),
        headers: { 'Content-Type': 'application/json' },
    };

    if (details.requestBody) {
        const schema = details.requestBody.content['application/json'].schema;
        const example = generateExampleFromSchema(schema, spec);
        options.body = `JSON.stringify(${JSON.stringify(example, null, 2)})`;
    }

    js += `const options = {\n  method: '${options.method}',\n  headers: ${JSON.stringify(options.headers)},\n`;
    if(options.body) {
        js += `  body: ${options.body}\n`
    }
    js += `};\n\n`;

    js += `fetch(url, options)\n  .then(res => res.json())\n  .then(json => console.log(json))\n  .catch(err => console.error('error:' + err));`;
    return js;
};

const generatePythonSnippet = (path: string, method: string, details: any, spec: any) => {
    let py = `import requests\nimport json\n\n`;
    py += `url = "${API_BASE_URL}/api/v1${path}"\n`;
    
    if (details.requestBody) {
        const schema = details.requestBody.content['application/json'].schema;
        const example = generateExampleFromSchema(schema, spec);
        py += `payload = json.dumps(${JSON.stringify(example, null, 4)})\n`;
    } else {
        py += `payload = {}\n`;
    }
    
    py += `headers = {'Content-Type': 'application/json'}\n\n`;
    
    if (details.requestBody) {
        py += `response = requests.request("${method.toUpperCase()}", url, headers=headers, data=payload)\n`;
    } else {
        py += `response = requests.request("${method.toUpperCase()}", url, headers=headers)\n`;
    }
    
    py += `\nprint(response.text)`;
    return py;
};

const generateJavaSnippet = (path: string, method: string, details: any, spec: any) => {
    const fullUrl = `${API_BASE_URL}/api/v1${path}`;
    const upperMethod = method.toUpperCase();
    let java = `import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.io.IOException;

public class ApiRequest {
    public static void main(String[] args) throws IOException, InterruptedException {
        HttpClient client = HttpClient.newHttpClient();
`;

    let requestBuilder = `HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("${fullUrl}"))
                .header("Content-Type", "application/json")`;

    if (details.requestBody) {
        const schema = details.requestBody.content['application/json'].schema;
        const example = generateExampleFromSchema(schema, spec);
        const jsonBody = JSON.stringify(example, null, 2);
        
        java += `
        String jsonBody = """
${jsonBody}
        """;
`;
        requestBuilder += `
                .${upperMethod}(HttpRequest.BodyPublishers.ofString(jsonBody))`;
    } else {
        requestBuilder += `
                .${upperMethod}()`;
    }
    
    requestBuilder += `
                .build();`;

    java += `\n        ${requestBuilder}\n`;

    java += `
        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

        System.out.println("Status Code: " + response.statusCode());
        System.out.println("Response Body: " + response.body());
    }
}`;

    return java;
};

const generateDartSnippet = (path: string, method: string, details: any, spec: any) => {
    const fullUrl = `${API_BASE_URL}/api/v1${path}`;
    const lowerMethod = method.toLowerCase();
    
    let dart = `import 'package:http/http.dart' as http;
import 'dart:convert';

void main() async {
  var url = Uri.parse('${fullUrl}');
  var headers = {"Content-Type": "application/json"};
`;

    let methodCall: string;

    if (details.requestBody) {
        const schema = details.requestBody.content['application/json'].schema;
        const example = generateExampleFromSchema(schema, spec);
        const jsonBody = JSON.stringify(example, null, 2);
        dart += `
  var body = json.encode(${jsonBody});
`;
        methodCall = `await http.${lowerMethod}(url, headers: headers, body: body);`;
    } else {
        methodCall = `await http.${lowerMethod}(url, headers: headers);`;
    }

    dart += `
  var response = ${methodCall}

  print('Response status: \${response.statusCode}');
  print('Response body: \${response.body}');
}`;

    return dart;
};

const generatePhpSnippet = (path: string, method: string, details: any, spec: any) => {
    const fullUrl = `${API_BASE_URL}/api/v1${path}`;
    const upperMethod = method.toUpperCase();

    let php = `<?php

$curl = curl_init();

curl_setopt_array($curl, [
  CURLOPT_URL => "${fullUrl}",
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_ENCODING => "",
  CURLOPT_MAXREDIRS => 10,
  CURLOPT_TIMEOUT => 30,
  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
  CURLOPT_CUSTOMREQUEST => "${upperMethod}",`;

    if (details.requestBody) {
        const schema = details.requestBody.content['application/json'].schema;
        const example = generateExampleFromSchema(schema, spec);
        const jsonBody = JSON.stringify(example, null, 2);
        php += `
  CURLOPT_POSTFIELDS => '${jsonBody.replace(/'/g, "\\'")}',`;
    }

    php += `
  CURLOPT_HTTPHEADER => [
    "Content-Type: application/json"
  ],
]);

$response = curl_exec($curl);
$err = curl_error($curl);

curl_close($curl);

if ($err) {
  echo "cURL Error #:" . $err;
} else {
  echo $response;
}
`;
    return php;
};

const generateCSharpSnippet = (path: string, method: string, details: any, spec: any) => {
    const fullUrl = `${API_BASE_URL}/api/v1${path}`;
    const upperMethod = method.toUpperCase();

    let csharp = `using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;

class ApiClient
{
    private static readonly HttpClient client = new HttpClient();

    static async Task Main(string[] args)
    {
        await CallApi();
    }

    static async Task CallApi()
    {
        client.DefaultRequestHeaders.Accept.Clear();
        client.DefaultRequestHeaders.Accept.Add(
            new MediaTypeWithQualityHeaderValue("application/json"));

        var url = "${fullUrl}";
`;
    
    let requestBlock = '';
    if (details.requestBody) {
        const schema = details.requestBody.content['application/json'].schema;
        const example = generateExampleFromSchema(schema, spec);
        const jsonBody = JSON.stringify(example, null, 2);
        
        csharp += `
        var jsonContent = new StringContent(
            @"${jsonBody.replace(/"/g, '""')}",
            Encoding.UTF8,
            "application/json");
`;
    }

    if (upperMethod === 'GET') {
        requestBlock = `var response = await client.GetAsync(url);`;
    } else if (upperMethod === 'DELETE') {
        requestBlock = `var response = await client.DeleteAsync(url);`;
    } else if (upperMethod === 'POST') {
        const content = details.requestBody ? 'jsonContent' : 'new StringContent("{}", Encoding.UTF8, "application/json")';
        requestBlock = `var response = await client.PostAsync(url, ${content});`;
    } else if (upperMethod === 'PUT') {
        const content = details.requestBody ? 'jsonContent' : 'new StringContent("{}", Encoding.UTF8, "application/json")';
        requestBlock = `var response = await client.PutAsync(url, ${content});`;
    } else {
        requestBlock = `
        var request = new HttpRequestMessage(new HttpMethod("${upperMethod}"), url);
${details.requestBody ? '        request.Content = jsonContent;' : ''}
        var response = await client.SendAsync(request);`;
    }

    csharp += `
        try
        {
            ${requestBlock}
            
            if (response.IsSuccessStatusCode)
            {
                string responseBody = await response.Content.ReadAsStringAsync();
                Console.WriteLine(responseBody);
            }
            else
            {
                Console.WriteLine($"Error: {response.StatusCode} {response.ReasonPhrase}");
            }
        }
        catch (Exception e)
        {
            Console.WriteLine($"Request failed: {e.Message}");
        }
    }
}`;
    return csharp;
};


interface ApiCodeSnippetsProps {
    path: string;
    method: string;
    details: any;
    spec: any;
}

const ApiCodeSnippets: React.FC<ApiCodeSnippetsProps> = ({ path, method, details, spec }) => {
    const [tab, setTab] = useState(0);
    const [copied, setCopied] = useState(false);

    const snippets = useMemo(() => {
        return [
            { label: 'cURL', code: generateCurlSnippet(path, method, details, spec) },
            { label: 'JavaScript', code: generateJsSnippet(path, method, details, spec) },
            { label: 'Python', code: generatePythonSnippet(path, method, details, spec) },
            { label: 'Java', code: generateJavaSnippet(path, method, details, spec) },
            { label: 'Dart', code: generateDartSnippet(path, method, details, spec) },
            { label: 'PHP', code: generatePhpSnippet(path, method, details, spec) },
            { label: 'C#', code: generateCSharpSnippet(path, method, details, spec) },
        ];
    }, [path, method, details, spec]);
    
    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTab(newValue);
        setCopied(false);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(snippets[tab].code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Paper variant="outlined" sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
             <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', px: 2, pt: 2 }}>Request Examples</Typography>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 1 }}>
                <Tabs
                    value={tab}
                    onChange={handleTabChange}
                    variant="scrollable"
                    scrollButtons="auto"
                    allowScrollButtonsMobile
                >
                    {snippets.map(s => <Tab key={s.label} label={s.label} sx={{textTransform: 'none'}} />)}
                </Tabs>
            </Box>
            <Box sx={{ position: 'relative', flexGrow: 1, minHeight: 200 }}>
                <Tooltip title={copied ? "Copied!" : "Copy to clipboard"}>
                    <IconButton onClick={handleCopy} sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}>
                        {copied ? <CheckIcon fontSize="small" color="success" /> : <ContentCopyIcon fontSize="small" />}
                    </IconButton>
                </Tooltip>
                <Box
                    component="pre"
                    sx={{
                        m: 0,
                        p: 2,
                        bgcolor: 'action.hover',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all',
                        fontFamily: 'monospace',
                        fontSize: '0.8rem',
                        lineHeight: 1.6,
                        height: '100%',
                        overflow: 'auto',
                        borderBottomLeftRadius: 'inherit',
                        borderBottomRightRadius: 'inherit',
                    }}
                >
                    <code>
                        {snippets[tab].code}
                    </code>
                </Box>
            </Box>
        </Paper>
    );
};

export default ApiCodeSnippets;
