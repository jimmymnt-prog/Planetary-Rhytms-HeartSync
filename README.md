# HeartSync — Planetary Rhythms · V2

Une refonte complète de l’expérience de respiration guidée d’origine. Le projet fonctionne sans compte ni service tiers obligatoire et se déploie comme un site statique.

## Lancer en local

Le mode application installable et le fonctionnement hors ligne nécessitent `localhost` ou HTTPS (les règles du navigateur l’exigent pour un service worker). Depuis ce dossier :

```bash
python3 -m http.server 8000
```

Puis ouvre `http://localhost:8000`. Pour un aperçu rapide, `index.html` peut aussi être ouvert directement, mais l’installation PWA/hors ligne ne sera pas activée.

## Fonctionnalités

- Six univers visuels, quatre rythmes réglables (3/3, 4/6, 5/5, 6/4) et cinq durées de 1 à 15 minutes.
- Guide animé avec phases, décompte, progression, cycles, pause, reprise et arrêt.
- Cinq ambiances audio locales, activées seulement à l’action de la personne.
- Préférences conservées dans le stockage local du navigateur; aucun compte, cookie publicitaire ou envoi de données.
- PWA installable; interface et visuels essentiels disponibles hors ligne après la première visite. Les fichiers audio restent chargés à la demande et ne sont pas ajoutés au cache hors ligne.
- Mise en page mobile/ordinateur, navigation clavier, états accessibles, dialogues, textes de sécurité, contraste soigné et réduction des animations selon les réglages système.
- Métadonnées SEO, aperçu Open Graph/Twitter 1200×630, données structurées, icônes SVG/PNG, manifeste, fichier robots.txt et en-têtes de sécurité pour les hébergeurs compatibles.

## Mise en ligne et référencement

Le site est statique : dépose le contenu du dossier sur Netlify, Vercel, Cloudflare Pages, GitHub Pages ou un hébergement classique, avec HTTPS activé. `_headers` sert à Netlify/Cloudflare Pages; `vercel.json` configure les en-têtes Vercel.

Avant publication :

1. Remplace le titre, les textes et descriptions si l’identité commerciale diffère de HeartSync.
2. Configure le domaine définitif dans `og:url` si ajouté, renseigne une URL canonique absolue dans `<head>` et crée un `sitemap.xml` avec ce domaine. Ne laisse pas d’URL d’exemple.
3. Vérifie l’aperçu social sur le domaine réel.
4. Fais vérifier les droits d’usage commercial des illustrations planétaires et surtout des pistes audio issues du projet d’origine. Une licence de code ne confère pas automatiquement les droits sur les médias.
5. Complète les mentions légales/éditeur, conditions, politique de confidentialité et coordonnées requises selon l’exploitant, le pays et le modèle économique. L’interface ne collecte pas de données, mais l’hébergeur peut conserver ses journaux techniques.
6. Vérifie sur appareils réels, avec VoiceOver/TalkBack et clavier, et exécute PageSpeed Insights/Lighthouse après déploiement. Les résultats SEO/performance ne peuvent être validés complètement avant que le domaine soit public.

Le `canonical` est intentionnellement absent tant qu’aucun vrai domaine n’est renseigné. Le balisage JSON-LD décrit l’application comme gratuite conformément à la version de démonstration; ajuste-le si le modèle commercial change.

## Structure

- `index.html` — contenu, SEO, interface et textes d’information.
- `styles.css` — identité visuelle responsive et thèmes clair/sombre.
- `app.js` — configuration, animation, minuterie, audio, PWA et stockage local.
- `service-worker.js`, `manifest.webmanifest` — installation et cache hors ligne.
- `assets/planets/`, `assets/audio/` — médias locaux optimisés issus du ZIP fourni.

## Note bien-être

HeartSync guide une respiration volontaire et ne mesure pas la fréquence cardiaque. Ce n’est pas un dispositif médical et l’application ne remplace pas un avis professionnel. Arrête la pratique en cas d’inconfort.
