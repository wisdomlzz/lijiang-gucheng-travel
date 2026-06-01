import { HeritageItem, HeritageType } from '../../types/heritage';
import { roadsData } from './roads';
import { watersData } from './waters';
import { wellsData } from './wells';
import { bridgesData } from './bridges';
import { treesData } from './trees';
import { residencesData } from './residences';
import { publicStructuresData } from './publicStructures';
import { culturalEnvironmentsData } from './culturalEnvironments';

export const heritageData: Record<HeritageType, HeritageItem[]> = {
  road: roadsData,
  water: watersData,
  well: wellsData,
  bridge: bridgesData,
  tree: treesData,
  residence: residencesData,
  publicStructure: publicStructuresData,
  culturalEnvironment: culturalEnvironmentsData,
};

export function getHeritageByType(type: HeritageType): HeritageItem[] {
  return heritageData[type] || [];
}

export function getHeritageById(id: string): HeritageItem | undefined {
  for (const type of Object.keys(heritageData) as HeritageType[]) {
    const item = heritageData[type].find(h => h.id === id);
    if (item) return item;
  }
  return undefined;
}

export function searchHeritage(keyword: string, type?: HeritageType): HeritageItem[] {
  const data = type ? heritageData[type] : Object.values(heritageData).flat();
  if (!keyword.trim()) return data;
  const lower = keyword.toLowerCase();
  return data.filter(
    h =>
      h.name.toLowerCase().includes(lower) ||
      h.description.toLowerCase().includes(lower)
  );
}

// Re-export for convenience
export {
  roadsData,
  watersData,
  wellsData,
  bridgesData,
  treesData,
  residencesData,
  publicStructuresData,
  culturalEnvironmentsData,
};