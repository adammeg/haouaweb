# Accès d’Assist aux données du cabinet

Assist utilise désormais les données du cabinet déjà chargées dans l’application, en complément de l’analyse IA du dossier ouvert. Les lectures simples ne dépendent pas du modèle : un agenda réel n’est pas remplacé par une réponse supposée du modèle.

| Demande | Comportement |
| --- | --- |
| « Bonjour assist, ouvre le dossier de Fatima Ben Ali » | Recherche par identité dans les profils du cabinet connecté, puis ouverture du dossier. En cas d’homonymes, un choix est demandé. |
| « Résume le dossier de Fatima Ben Ali » | Ouverture du dossier nommé, sauvegarde et synchronisation, puis analyse de la révision autorisée par le serveur. |
| « Qui est ma patiente ? », « Quels sont ses traitements ? » | Lecture du dossier actif, avec « non renseigné » si le champ est vide. |
| « Quels sont mes rendez-vous demain ? » | Lecture de l’agenda chargé, avec date, heure, patiente, durée et statut. Les rendez-vous annulés sont exclus. |
| « Quel est mon prochain rendez-vous ? » | Premier rendez-vous non annulé à venir selon l’heure de Paris. |
| « Les rendez-vous de ma patiente actuelle » | Filtrage par l’identité de la patiente du dossier ouvert ; les rendez-vous historiques étant liés par nom, les homonymes ne peuvent pas être distingués automatiquement. |
| « Et demain ? » après une lecture de l’agenda | Conservation du filtre et changement de période. |
| « Qui est en salle d’attente ? » | Lecture de la file du profil actif, pour aujourd’hui. |
| « Quels sont mes rappels ? » | Lecture des rappels manuels non terminés. |
| « Sauvegarde le dossier » | Sauvegarde locale puis confirmation serveur ; l’échec de synchronisation est annoncé. |
| « Prends un rendez-vous pour la patiente actuelle demain à 14 heures 30 » | Ouverture du formulaire habituel avec patiente, date et heure préremplies. Le médecin peut corriger puis enregistrer. Aucun rendez-vous n’est ajouté avant validation. |

Les listes sont volontairement courtes à l’oral. Les dates relatives sont calculées pour Europe/Paris ; « cette semaine » couvre du lundi au dimanche. Les dates et heures invalides nécessitent une précision. Les noms ambigus ne donnent lieu à aucune ouverture automatique.

## Isolation et disponibilité

Un état de chargement distinct suit les dossiers et les données cliniques hors dossier. Il est rattaché au médecin connecté. Une réponse ancienne provenant d’un autre compte ne peut pas rendre le nouveau compte « prêt ». Un agenda non chargé ou en erreur ne doit jamais être annoncé comme vide.

Les lectures utilisent les stores de l’application : elles reflètent donc aussi les modifications locales affichées. Elles ne certifient pas à elles seules une synchronisation serveur immédiate. L’analyse clinique continue d’exiger une sauvegarde serveur et une révision vérifiée.

Les sauvegardes automatiques de l’agenda sont sérialisées ; une modification pendant une sauvegarde reste à envoyer au lieu d’être considérée comme déjà sauvegardée. L’ouverture d’un autre dossier conserve d’abord le brouillon du dossier précédent.

Le choix d’une patiente, la préparation d’un rendez-vous et les modifications cliniques sont abandonnés lors d’un changement de compte/profil/dossier ou d’une fermeture de session. Le formulaire de rendez-vous est rendu dans le corps de la page, au-dessus de l’interface, plutôt qu’à l’intérieur de la barre flottante.

## Limites

Les commandes décrites correspondent à des fonctions réellement branchées. Assist ne dispose pas d’un accès arbitraire à la base de données. L’annulation, la suppression et la reprogrammation d’un rendez-vous restent accessibles dans le formulaire habituel ; elles ne sont pas exécutées librement par le modèle. Les documents joints ne sont pas tous lus ou transcrits automatiquement.

Les tests utilisent des dossiers et rendez-vous synthétiques. Ils couvrent la lecture réelle de l’agenda sans appel IA, le chargement incomplet, les comptes distincts, les homonymes, le résumé d’un dossier nommé avec révision serveur, et la création uniquement après validation du formulaire. L’exactitude de la reconnaissance vocale avec un microphone réel reste à vérifier sur les appareils utilisés.
