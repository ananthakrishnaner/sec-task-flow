/**
 * Calculate similarity between two strings using Levenshtein distance
 * Returns a score between 0 and 1, where 1 is identical
 */
const calculateSimilarity = (str1: string, str2: string): number => {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;
  
  // Check if one contains the other
  if (s1.includes(s2) || s2.includes(s1)) {
    return 0.8;
  }
  
  // Levenshtein distance
  const matrix: number[][] = [];
  
  for (let i = 0; i <= s2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= s1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= s2.length; i++) {
    for (let j = 1; j <= s1.length; j++) {
      if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  const maxLength = Math.max(s1.length, s2.length);
  const distance = matrix[s2.length][s1.length];
  return 1 - distance / maxLength;
};

/**
 * Find similar squad names from existing tasks
 * Returns the most similar squad name if similarity is above threshold
 */
export const findSimilarSquad = (
  input: string,
  existingSquads: string[],
  threshold: number = 0.6
): string | null => {
  if (!input || input.length < 2) return null;
  
  // Remove duplicates and current input
  const uniqueSquads = [...new Set(existingSquads)]
    .filter(squad => squad.toLowerCase() !== input.toLowerCase());
  
  if (uniqueSquads.length === 0) return null;
  
  // Find the most similar squad
  let maxSimilarity = 0;
  let mostSimilar: string | null = null;
  
  uniqueSquads.forEach(squad => {
    const similarity = calculateSimilarity(input, squad);
    if (similarity > maxSimilarity && similarity >= threshold) {
      maxSimilarity = similarity;
      mostSimilar = squad;
    }
  });
  
  return mostSimilar;
};

/**
 * Get all unique squad names from project tasks
 */
export const getExistingSquadNames = (tasks: { squadName: string }[]): string[] => {
  return tasks.map(task => task.squadName).filter(Boolean);
};
