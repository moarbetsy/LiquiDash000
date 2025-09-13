import { db } from '../firebase';
import { collection, doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

/**
 * Test Firestore connectivity and basic operations
 */
export async function testFirestoreConnection(): Promise<{
  success: boolean;
  message: string;
  data?: any;
}> {
  try {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      return {
        success: false,
        message: 'User not authenticated'
      };
    }

    // Test writing to user's test collection
    const testDocRef = doc(collection(db, 'users', user.uid, 'test'));
    const testData = {
      timestamp: new Date().toISOString(),
      userId: user.uid,
      test: true
    };

    await setDoc(testDocRef, testData);

    // Test reading the document
    const docSnap = await getDoc(testDocRef);
    if (docSnap.exists()) {
      // Clean up test document
      await deleteDoc(testDocRef);

      return {
        success: true,
        message: 'Firestore connection successful',
        data: docSnap.data()
      };
    } else {
      return {
        success: false,
        message: 'Test document was not created'
      };
    }
  } catch (error) {
    console.error('Firestore test error:', error);
    return {
      success: false,
      message: `Firestore test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Test database structure and collections
 */
export async function testDatabaseStructure(): Promise<{
  success: boolean;
  message: string;
  collections?: string[];
}> {
  try {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      return {
        success: false,
        message: 'User not authenticated'
      };
    }

    // Test each collection exists and is accessible
    const collections = ['clients', 'products', 'orders', 'expenses', 'logs'];
    const results = [];

    for (const collectionName of collections) {
      try {
        const testDocRef = doc(collection(db, 'users', user.uid, collectionName, 'test-structure'));
        await setDoc(testDocRef, { test: true, timestamp: new Date().toISOString() });
        await deleteDoc(testDocRef); // Clean up
        results.push(`${collectionName}: OK`);
      } catch (error) {
        results.push(`${collectionName}: FAILED - ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    const allSuccessful = results.every(result => result.includes('OK'));

    return {
      success: allSuccessful,
      message: allSuccessful ? 'All collections accessible' : 'Some collections failed',
      collections: results
    };
  } catch (error) {
    return {
      success: false,
      message: `Database structure test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}
