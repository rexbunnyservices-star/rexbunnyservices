import json, urllib.request, os

TOKEN = os.environ.get('CLOUDFLARE_API_TOKEN', '')
ACCOUNT = 'b59e38ec6e735d414dd1cef8c4739ebd'
PROJECT = 'rex-bunny-services'

if not TOKEN:
    print("ERROR: Set CLOUDFLARE_API_TOKEN environment variable")
    exit(1)

body = {
    'deployment_configs': {
        'production': {
            'env_vars': {
                'LISTMONK_PASS': {
                    'type': 'secret_text',
                    'value': 'lmk_api_9q1zweip4rg6hfbnd38ay2sm57oxjtlu'
                },
                'PUBLIC_SITE_URL': {
                    'type': 'plain_text',
                    'value': 'https://rexbunnyservices.online'
                }
            }
        }
    }
}

req = urllib.request.Request(
    f'https://api.cloudflare.com/client/v4/accounts/{ACCOUNT}/pages/projects/{PROJECT}',
    data=json.dumps(body).encode(),
    headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'},
    method='PATCH'
)
try:
    resp = json.loads(urllib.request.urlopen(req).read())
    success = resp['success']
    if success:
        ev = resp['result']['deployment_configs']['production']['env_vars']
        var_list = ', '.join(ev.keys())
        print(f"OK: {var_list}")
    else:
        print(f"FAIL: {resp.get('errors')}")
except Exception as e:
    print(f"ERROR: {e}")
