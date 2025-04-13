import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Récupère l'utilisateur par son identifiant.
 * @param userId L'identifiant de l'utilisateur.
 * @returns Les données de l'utilisateur ou null si non trouvé.
 */
export const getUserById = async (userId: number) => {
    return prisma.user.findUnique({
        where: { id: userId },
    });
};
