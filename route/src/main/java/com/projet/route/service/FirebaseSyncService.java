package com.projet.route.service;

import com.google.cloud.firestore.Firestore;
import com.google.firebase.cloud.FirestoreClient;
import com.projet.route.models.Signalement;
import com.projet.route.models.Travaux;
import com.projet.route.models.HistoriquesTravaux;
import com.projet.route.repository.SignalementRepository;
import com.projet.route.repository.TravauxRepository;
import com.projet.route.repository.HistoriquesTravauxRepository;
import com.projet.route.repository.EntrepriseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.concurrent.ExecutionException;

@Service
public class FirebaseSyncService {

    @Autowired
    private SignalementRepository signalementRepository;

    @Autowired
    private TravauxRepository travauxRepository;

    @Autowired
    private HistoriquesTravauxRepository historiquesTravauxRepository;

    @Autowired
    private EntrepriseRepository entrepriseRepository;

    public void syncSignalementsToLocal() {
        try {
            System.out.println("Starting syncSignalementsToLocal");
            Firestore db = FirestoreClient.getFirestore();
            System.out.println("Firestore client obtained");

            // Sync signalements
            var signalementsQuery = db.collection("signalements").get();
            var signalementsDocs = signalementsQuery.get().getDocuments();
            System.out.println("Retrieved " + signalementsDocs.size() + " signalements from Firestore");

            for (var doc : signalementsDocs) {
                try {
                    var data = doc.getData();
                    System.out.println("Processing signalement doc: " + doc.getId() + ", data: " + data);
                    Signalement signalement = new Signalement();
                    signalement.setFirestoreId(doc.getId());
                    
                    // Handle latitude
                    Object latObj = data.get("latitude");
                    if (latObj instanceof Double) {
                        signalement.setLatitude(BigDecimal.valueOf((Double) latObj));
                    } else if (latObj instanceof Long) {
                        signalement.setLatitude(BigDecimal.valueOf((Long) latObj));
                    } else if (latObj instanceof String) {
                        signalement.setLatitude(new BigDecimal((String) latObj));
                    } else {
                        System.err.println("Invalid latitude type for doc " + doc.getId() + ": " + latObj.getClass());
                        continue;
                    }
                    
                    // Handle longitude
                    Object lngObj = data.get("longitude");
                    if (lngObj instanceof Double) {
                        signalement.setLongitude(BigDecimal.valueOf((Double) lngObj));
                    } else if (lngObj instanceof Long) {
                        signalement.setLongitude(BigDecimal.valueOf((Long) lngObj));
                    } else if (lngObj instanceof String) {
                        signalement.setLongitude(new BigDecimal((String) lngObj));
                    } else {
                        System.err.println("Invalid longitude type for doc " + doc.getId() + ": " + lngObj.getClass());
                        continue;
                    }
                    
                    signalement.setIdUser((String) data.get("Id_User"));
                    
                    // Handle surface
                    Object surfObj = data.get("surface");
                    if (surfObj != null) {
                        if (surfObj instanceof Double) {
                            signalement.setSurface(BigDecimal.valueOf((Double) surfObj));
                        } else if (surfObj instanceof Long) {
                            signalement.setSurface(BigDecimal.valueOf((Long) surfObj));
                        } else if (surfObj instanceof String) {
                            signalement.setSurface(new BigDecimal((String) surfObj));
                        }
                    }
                    
                    signalement.setTypeProbleme((String) data.get("type_probleme"));
                    signalement.setDescription((String) data.get("description"));
                    signalement.setStatut((String) data.get("statut"));
                    
                    if (data.get("date_ajoute") != null) {
                        // Assuming date_ajoute is a Firestore Timestamp
                        var timestamp = (com.google.cloud.Timestamp) data.get("date_ajoute");
                        signalement.setDateAjoute(LocalDateTime.ofInstant(timestamp.toDate().toInstant(), ZoneOffset.UTC));
                    }

                    // Check if already exists by firestoreId
                    var existing = signalementRepository.findByFirestoreId(doc.getId());
                    if (existing == null) {
                        signalementRepository.save(signalement);
                        System.out.println("Saved new signalement: " + doc.getId());
                    } else {
                        System.out.println("Signalement already exists: " + doc.getId());
                    }
                } catch (Exception e) {
                    System.err.println("Error processing signalement " + doc.getId() + ": " + e.getMessage());
                    e.printStackTrace();
                }
            }

            // Sync travaux
            var travauxQuery = db.collection("travaux").get();
            var travauxDocs = travauxQuery.get().getDocuments();

            for (var doc : travauxDocs) {
                var data = doc.getData();
                Travaux travaux = new Travaux();
                travaux.setFirestoreId(doc.getId());

                if (data.get("id_signalement") != null) {
                    String signalementFirestoreId = data.get("id_signalement").toString();
                    var signalement = signalementRepository.findByFirestoreId(signalementFirestoreId);
                    if (signalement != null) {
                        travaux.setSignalement(signalement);
                    }
                }

                if (data.get("id_entreprise") != null) {
                    Long entrepriseId = Long.parseLong(data.get("id_entreprise").toString());
                    entrepriseRepository.findById(entrepriseId).ifPresent(travaux::setEntreprise);
                }

                if (data.get("budget") != null) {
                    Object budgetObj = data.get("budget");
                    double budgetValue;
                    if (budgetObj instanceof Long) {
                        budgetValue = ((Long) budgetObj).doubleValue();
                    } else if (budgetObj instanceof Double) {
                        budgetValue = (Double) budgetObj;
                    } else {
                        budgetValue = Double.parseDouble(budgetObj.toString());
                    }
                    travaux.setBudget(BigDecimal.valueOf(budgetValue));
                }

                if (data.get("date_debut_travaux") != null) {
                    var timestamp = (com.google.cloud.Timestamp) data.get("date_debut_travaux");
                    travaux.setDateDebutTravaux(timestamp.toDate().toInstant().atZone(java.time.ZoneId.systemDefault()).toLocalDate());
                }

                if (data.get("date_fin_travaux") != null) {
                    var timestamp = (com.google.cloud.Timestamp) data.get("date_fin_travaux");
                    travaux.setDateFinTravaux(timestamp.toDate().toInstant().atZone(java.time.ZoneId.systemDefault()).toLocalDate());
                }

                if (data.get("avancement") != null) {
                    Object avancementObj = data.get("avancement");
                    double avancementValue;
                    if (avancementObj instanceof Long) {
                        avancementValue = ((Long) avancementObj).doubleValue();
                    } else if (avancementObj instanceof Double) {
                        avancementValue = (Double) avancementObj;
                    } else {
                        avancementValue = Double.parseDouble(avancementObj.toString());
                    }
                    travaux.setAvancement(BigDecimal.valueOf(avancementValue));
                }

                // Check if already exists by firestoreId
                var existing = travauxRepository.findByFirestoreId(doc.getId());
                if (existing == null) {
                    travauxRepository.save(travaux);
                }
            }

        } catch (InterruptedException | ExecutionException e) {
            throw new RuntimeException("Error syncing from Firestore", e);
        }
    }

    public void syncTravauxToFirestore(Travaux travaux) {
        try {
            Firestore db = FirestoreClient.getFirestore();

            String docId = travaux.getFirestoreId() != null ? travaux.getFirestoreId() : travaux.getId().toString();
            var docRef = db.collection("travaux").document(docId);

            var data = new java.util.HashMap<String, Object>();
            if (travaux.getSignalement() != null && travaux.getSignalement().getFirestoreId() != null) {
                data.put("id_signalement", travaux.getSignalement().getFirestoreId());
            }
            if (travaux.getEntreprise() != null) {
                data.put("id_entreprise", travaux.getEntreprise().getIdEntreprise().toString());
            }
            if (travaux.getBudget() != null) {
                data.put("budget", travaux.getBudget().doubleValue());
            }
            if (travaux.getDateDebutTravaux() != null) {
                data.put("date_debut_travaux", com.google.cloud.Timestamp.of(java.sql.Date.valueOf(travaux.getDateDebutTravaux())));
            }
            if (travaux.getDateFinTravaux() != null) {
                data.put("date_fin_travaux", com.google.cloud.Timestamp.of(java.sql.Date.valueOf(travaux.getDateFinTravaux())));
            }
            if (travaux.getAvancement() != null) {
                data.put("avancement", travaux.getAvancement().doubleValue());
            }

            docRef.set(data).get();

            // If this was a new document, update the firestoreId
            if (travaux.getFirestoreId() == null) {
                travaux.setFirestoreId(docId);
                travauxRepository.save(travaux);
            }

        } catch (InterruptedException | ExecutionException e) {
            // Log error but don't throw - sync should be optional
            System.err.println("Error syncing travaux to Firestore: " + e.getMessage());
        }
    }

    public void syncHistoriquesTravauxToFirestore(HistoriquesTravaux historique) {
        try {
            Firestore db = FirestoreClient.getFirestore();

            String docId = historique.getFirestoreId() != null ? historique.getFirestoreId() : historique.getId().toString();
            var docRef = db.collection("historiques_travaux").document(docId);

            var data = new java.util.HashMap<String, Object>();
            if (historique.getTravaux() != null && historique.getTravaux().getFirestoreId() != null) {
                data.put("id_travaux", historique.getTravaux().getFirestoreId());
            }
            if (historique.getDateModification() != null) {
                data.put("date_modification", com.google.cloud.Timestamp.of(java.sql.Timestamp.valueOf(historique.getDateModification())));
            }
            if (historique.getAvancement() != null) {
                data.put("avancement", historique.getAvancement().doubleValue());
            }
            data.put("commentaire", historique.getCommentaire());

            docRef.set(data).get();

            // If this was a new document, update the firestoreId
            if (historique.getFirestoreId() == null) {
                historique.setFirestoreId(docId);
                historiquesTravauxRepository.save(historique);
            }

        } catch (InterruptedException | ExecutionException e) {
            // Log error but don't throw - sync should be optional
            System.err.println("Error syncing historiques travaux to Firestore: " + e.getMessage());
        }
    }
}