import { HeritageItem, HeritageType } from '../../types/heritage';
import { roadsData } from './roads';
import { watersData } from './waters';
import { wellsData } from './wells';
import { bridgesData } from './bridges';
import { ancientTreesData } from './ancientTrees';
import { protectedHousesData } from './protectedHouses';
import { historicBuildingsData } from './historicBuildings';
import { humanEnvironmentsData } from './humanEnvironments';

export const heritageData: Record<HeritageType, HeritageItem[]> = {
  road: roadsData,
  water: watersData,
  well: wellsData,
  bridge: bridgesData,
  'ancient-tree': ancientTreesData,
  'protected-house': protectedHousesData,
  'historic-building': historicBuildingsData,
  'human-environment': humanEnvironmentsData,
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
  ancientTreesData,
  protectedHousesData,
  historicBuildingsData,
  humanEnvironmentsData,
};
