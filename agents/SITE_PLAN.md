# stellahu.me personal-site plan (separate from the chat journal)

> Revised 2026-11-15. Site migration remains planned; historical observations below have not been rechecked during this documentation reset. This is not a prerequisite for local app v1.

## Preserve the personal-site direction

- Use the existing Jekyll/Chirpy repository, stella-hu-xing.github.io, for the personal introduction, blog, and project list.
- Replace the apex Hashnode site with that personal site when the owner carries out the migration.
- Keep Porkbun as registrar. The prior Cloudflare Pages apex-domain plan moves DNS nameservers to Cloudflare, with records verified before any change.
- Keep GitHub Pages available in parallel. Site deployment remains separately reviewed/manual; do not alter DNS or hosting in an app documentation task.

| Intended URL | Purpose |
|---|---|
| https://stellahu.me/ | Personal landing/introduction |
| https://stellahu.me/blog | Blog or mapping to the posts archive; exact layout undecided |
| https://stellahu.me/projects/ | Project descriptions and links |
| Existing GitHub Pages URL | Independent personal-site fallback |

## Superseded app assumptions

The earlier plan combined the entire Starward notes/schedule/countdown PWA into the Jekyll build under /projects/starward/. That coupling is no longer the app plan. The three tools are separate products; this repository first builds a local AI chat journal with a Node/SQLite backend.

- Do not require cross-repository checkout, copying the app build into the blog artifact, or VITE_BASE=/projects/starward/ as part of chat-journal v1.
- The project list may describe the chat journal without publicly exposing its UI or API. Link to separate schedule/countdown apps only when they exist.
- Local v1 has no chosen public app URL. A public static frontend alone cannot run Claude/STT proxying, SQLite, or scheduled reports.
- If independent PWAs are hosted together later, each needs its own identity/start URL/scope/service worker, without swallowing sibling paths. Choose subpaths vs subdomains at that time, not now.
- One shared Node backend could serve multiple frontends later; three app identities do not imply three servers. No future backend sharing is implemented or required here.

## Historical observations (2026-11-15, prior site plan)

These are records, not current uptime/DNS guarantees:

- Porkbun nameservers were salvador/fortaleza/maceio/curitiba.ns.porkbun.com; no MX records were observed.
- Apex A record pointed to 76.76.21.21 (Hashnode/Vercel); www CNAME pointed to hashnode.network.
- starward CNAME pointed to starward-3pw.pages.dev, but its custom-domain attachment/TLS was not working in that diagnosis.
- The existing Starward workflow uploads dist/web to a Cloudflare Pages Direct Upload project; it does not deploy a Node backend.
- The Jekyll repo used Chirpy, empty baseurl, about/archives/categories/tags tabs, and no posts at the time of inspection.

Recheck all records, mail settings, content, workflows, and domain attachments before acting. Do not delete a DNS record on the strength of this historical note alone.

## Site-only migration checklist (deferred)

- [ ] Inspect the Jekyll repo and verify its current instructions/content before edits.
- [ ] Decide introduction-first landing vs Chirpy defaults, blog mapping, and project descriptions. Add a Cloudflare-specific URL config without breaking GitHub Pages.
- [ ] Build/deploy the personal site independently to Cloudflare Pages (the previous proposed project name was stellahu-me). Do not bundle private app data or credentials.
- [ ] Export/review existing DNS, especially mail, before changing nameservers. Add/activate the Cloudflare zone while keeping Porkbun as registrar.
- [ ] Attach apex/www custom domains and verify TLS. Replace Hashnode records only after the site is ready; redirect www to apex if desired.
- [ ] Decide whether Hashnode retires or remains as an archive, and whether the old starward Pages project/subdomain is retained, redirected, or removed. Do not redirect it to an unbuilt /projects/starward/ path.
- [ ] Verify landing/blog/projects, redirects, certificates, and independent GitHub Pages availability. Keep previous Pages deploys and a tested DNS rollback record.

## Open decisions

- Personal-site content/layout and blog archive route.
- Hashnode archive policy; existing Starward static-preview retirement.
- Future app public hosting, access security, URL structure, and optional shared backend; none blocks local chat-journal v1.

## Rollback notes

Retain a DNS export and nameserver history before migration. Restore prior site records/deploy if necessary, accounting for propagation; nameserver changes alone are not an instant guaranteed rollback. Keep GitHub Pages independent. No database migration or chat-journal deployment belongs to this site procedure.
