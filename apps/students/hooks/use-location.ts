/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";

interface State {
  sigla: string;
  nome: string;
}

interface City {
  nome: string;
}

const BASE_URL = "https://servicodados.ibge.gov.br/api/v1/localidades/estados";

async function getStates(): Promise<State[]> {
  const response = await fetch(`${BASE_URL}?orderBy=nome`);

  if (!response.ok) throw new Error("Erro ao buscar estados");

  const data = await response.json();

  return data.map((state: any) => ({
    sigla: state.sigla,
    nome: state.nome,
  }));
}

async function getCitiesByState(uf: string): Promise<City[]> {
  if (!uf) return [];

  const response = await fetch(`${BASE_URL}/${uf}/municipios?orderBy=nome`);

  if (!response.ok) throw new Error("Erro ao buscar cidades");

  const data = await response.json();

  return data.map((city: any) => ({
    nome: city.nome,
  }));
}

export function useLocation() {
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);

  useEffect(() => {
    getStates()
      .then(setStates)
      .catch((err) => console.error("Falha ao carregar estados:", err));
  }, []);

  // Função para carregar cidades baseada na UF
  const loadCities = async (uf: string) => {
    if (!uf) {
      setCities([]);
      return;
    }

    setIsLoadingCities(true);
    try {
      const data = await getCitiesByState(uf);
      setCities(data);
    } catch (error) {
      console.error("Erro ao carregar cidades:", error);
    } finally {
      setIsLoadingCities(false);
    }
  };

  return { states, cities, loadCities, isLoadingCities };
}
