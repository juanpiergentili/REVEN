// Hook para subida de fotos con progreso individual por archivo
// Usa uploadBytesResumable para tracking de progreso real

import { useState, useCallback, useRef } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '@/src/lib/firebase';

export interface PhotoUploadState {
  /** Progreso de cada foto (0-100), indexado por posición */
  progress: number[];
  /** True mientras se estén subiendo fotos */
  isUploading: boolean;
  /** Cantidad total de fotos a subir */
  totalFiles: number;
  /** Cantidad de fotos ya completadas */
  completedFiles: number;
  /** Error si hubo alguno */
  error: string | null;
}

const INITIAL_STATE: PhotoUploadState = {
  progress: [],
  isUploading: false,
  totalFiles: 0,
  completedFiles: 0,
  error: null,
};

export function usePhotoUpload() {
  const [state, setState] = useState<PhotoUploadState>(INITIAL_STATE);
  const abortRef = useRef(false);

  const reset = useCallback(() => {
    abortRef.current = false;
    setState(INITIAL_STATE);
  }, []);

  const uploadPhotos = useCallback(async (
    files: File[],
    vehicleId: string,
    userId: string,
  ): Promise<string[]> => {
    if (files.length === 0) return [];

    abortRef.current = false;
    setState({
      progress: new Array(files.length).fill(0),
      isUploading: true,
      totalFiles: files.length,
      completedFiles: 0,
      error: null,
    });

    const urls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      if (abortRef.current) {
        throw new Error('Subida cancelada por el usuario.');
      }

      const file = files[i];
      const storageRef = ref(
        storage,
        `vehicles/${userId}/${vehicleId}/${Date.now()}_${file.name}`,
      );

      try {
        const url = await new Promise<string>((resolve, reject) => {
          const uploadTask = uploadBytesResumable(storageRef, file);

          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const pct = Math.round(
                (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
              );
              setState(prev => {
                const newProgress = [...prev.progress];
                newProgress[i] = pct;
                return { ...prev, progress: newProgress };
              });
            },
            (error) => reject(error),
            async () => {
              try {
                const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
                resolve(downloadUrl);
              } catch (e) {
                reject(e);
              }
            },
          );
        });

        urls.push(url);
        setState(prev => ({
          ...prev,
          completedFiles: prev.completedFiles + 1,
        }));
      } catch (err) {
        // Intento de retry (1 vez)
        try {
          const retryRef = ref(
            storage,
            `vehicles/${userId}/${vehicleId}/${Date.now()}_retry_${file.name}`,
          );
          const url = await new Promise<string>((resolve, reject) => {
            const retryTask = uploadBytesResumable(retryRef, file);
            retryTask.on(
              'state_changed',
              (snapshot) => {
                const pct = Math.round(
                  (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
                );
                setState(prev => {
                  const newProgress = [...prev.progress];
                  newProgress[i] = pct;
                  return { ...prev, progress: newProgress };
                });
              },
              (error) => reject(error),
              async () => {
                try {
                  const downloadUrl = await getDownloadURL(retryTask.snapshot.ref);
                  resolve(downloadUrl);
                } catch (e) {
                  reject(e);
                }
              },
            );
          });

          urls.push(url);
          setState(prev => ({
            ...prev,
            completedFiles: prev.completedFiles + 1,
          }));
        } catch (retryErr) {
          const msg = retryErr instanceof Error ? retryErr.message : String(retryErr);
          setState(prev => ({
            ...prev,
            isUploading: false,
            error: `Error al subir "${file.name}": ${msg}`,
          }));
          throw retryErr;
        }
      }
    }

    setState(prev => ({ ...prev, isUploading: false }));
    return urls;
  }, []);

  const cancel = useCallback(() => {
    abortRef.current = true;
  }, []);

  /** Progreso global (0-100) */
  const overallProgress = state.totalFiles > 0
    ? Math.round(state.progress.reduce((a, b) => a + b, 0) / state.totalFiles)
    : 0;

  return {
    ...state,
    overallProgress,
    uploadPhotos,
    cancel,
    reset,
  };
}
