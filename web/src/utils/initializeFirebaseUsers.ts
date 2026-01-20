// Script pour initialiser les utilisateurs dans Firebase
import { collection, addDoc } from 'firebase/firestore';
import { db } from './firebase';

export const initializeUsersInFirebase = async () => {
  try {
    // Utilisateur admin
    await addDoc(collection(db, 'utilisateurs'), {
      nomUtilisateur: 'admin',
      email: 'admin@gmail.com',
      motDePasse: 'admin',
      dateCreation: new Date(),
      sourceAuth: 'local'
    });

    // Utilisateur de test
    await addDoc(collection(db, 'utilisateurs'), {
      nomUtilisateur: 'testuser',
      email: 'test@example.com',
      motDePasse: 'password',
      dateCreation: new Date(),
      sourceAuth: 'local'
    });

    console.log('Utilisateurs initialisés dans Firebase');
  } catch (error) {
    console.error('Erreur lors de l\'initialisation des utilisateurs:', error);
  }
};