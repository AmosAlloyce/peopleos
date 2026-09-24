# PeopleOS migration review — n8n

Import `peopleos-migration.json` with n8n's **Import from File** menu. `peopleos-migration-review.json` is an identical descriptive alias. The workflow uses only built-in Manual Trigger, Code, HTTP Request, and Sticky Note nodes. No n8n credential or Groq key is embedded.

1. Start PeopleOS, then edit the **Configure demo** node's `baseUrl` to an address reachable by your n8n instance.
2. Use `http://127.0.0.1:3001` if both processes run on the same host. A container's `127.0.0.1` points to that container; use the app's service name on a shared Docker network, or the deployed HTTPS domain instead.
3. Execute the workflow manually. It checks health, starts a synthetic session, forwards the session cookie, and requests a migration analysis.
4. Inspect **Review proposal** for the actual checks, proposed changes, and approval instructions.

The workflow stops at `awaiting_approval`; it never applies fixes automatically. Its visitor session is separate from your browser's session, so its runs do not appear in an already-open browser workspace. Subsequent requests must carry the returned synthetic session cookie. Start a run in the website to demonstrate approval in the browser.

If the HTTP nodes fail, check the configured host, port, reverse-proxy reachability, and whether the service is running. A Groq key is optional and belongs only on the PeopleOS server.

Validation completed: workflow JSON, node connections, Code-node JavaScript, and the HTTP/session sequence against the actual API. The sequence returned 48 records, 16 proposed fixes, and zero applied fixes. Native import/execution has not been run inside n8n; verify that final step against your installed version.

Sources: [n8n import/export](https://docs.n8n.io/build/manage-workflows/export-and-import/), [HTTP Request response options](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest/).
