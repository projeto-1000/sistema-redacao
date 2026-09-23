"use client";

import { useEffect, useId, useState } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/ui/components/popover";

let cachedBanks: string[] | null = null;
let banksRequest: Promise<string[]> | null = null;

function loadBanks() {
  if (cachedBanks) return Promise.resolve(cachedBanks);

  if (!banksRequest) {
    banksRequest = fetch("https://brasilapi.com.br/api/banks/v1")
      .then((response) => {
        if (!response.ok)
          throw new Error("Não foi possível carregar os bancos.");
        return response.json() as Promise<unknown>;
      })
      .then((response) => {
        if (!Array.isArray(response))
          throw new Error("Lista de bancos inválida.");

        cachedBanks = [
          ...new Set(
            response
              .map((bank) =>
                bank && typeof bank === "object" && "name" in bank
                  ? bank.name
                  : null,
              )
              .filter(
                (name): name is string =>
                  typeof name === "string" &&
                  name.length > 1 &&
                  name.length <= 120,
              ),
          ),
        ].sort((a, b) => a.localeCompare(b, "pt-BR"));

        return cachedBanks;
      })
      .catch(() => {
        banksRequest = null;
        return [];
      });
  }

  return banksRequest;
}

interface BankNameInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function BankNameInput({ value, onChange }: BankNameInputProps) {
  const listId = useId();
  const [banks, setBanks] = useState<string[]>(cachedBanks ?? []);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let active = true;

    void loadBanks().then((names) => {
      if (active) setBanks(names);
    });

    return () => {
      active = false;
    };
  }, []);

  const normalizedSearch = normalize(search);
  const matchingBanks = banks
    .filter((bank) => normalize(bank).includes(normalizedSearch))
    .slice(0, 50);
  const customName = search.trim().slice(0, 120);
  const hasExactMatch = banks.some(
    (bank) =>
      bank.toLocaleLowerCase("pt-BR") === customName.toLocaleLowerCase("pt-BR"),
  );

  const selectBank = (name: string) => {
    onChange(name);
    setSearch("");
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) setSearch("");
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          className="h-12 w-full justify-between gap-2 overflow-hidden rounded-xl px-3 font-normal"
        >
          <span
            className={`truncate text-left ${value ? "" : "text-slate-400"}`}
          >
            {value || "Selecione ou busque o banco"}
          </span>
          <ChevronsUpDown className="size-4 shrink-0 text-slate-500" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-(--radix-popover-trigger-width) rounded-xl border-slate-200 p-2 shadow-lg"
      >
        <div className="relative">
          <Search className="pointer-events-none absolute top-3.5 left-3 size-4 text-slate-400" />
          <Input
            autoFocus
            value={search}
            onChange={(event) => setSearch(event.target.value.slice(0, 120))}
            onKeyDown={(event) => {
              if (event.key === "Enter" && customName) {
                event.preventDefault();
                selectBank(
                  banks.find(
                    (bank) =>
                      bank.toLocaleLowerCase("pt-BR") ===
                      customName.toLocaleLowerCase("pt-BR"),
                  ) ?? customName,
                );
              }
            }}
            placeholder="Pesquisar banco..."
            aria-label="Pesquisar banco"
            maxLength={120}
            className="h-11 rounded-lg pl-9"
          />
        </div>
        <div
          id={listId}
          role="listbox"
          aria-label="Bancos"
          className="mt-2 max-h-56 overflow-y-auto"
        >
          {matchingBanks.map((bank) => (
            <button
              key={bank}
              type="button"
              role="option"
              aria-selected={value === bank}
              onClick={() => selectBank(bank)}
              className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 focus-visible:bg-blue-50 focus-visible:outline-none"
            >
              <span className="truncate">{bank}</span>
              {value === bank && (
                <Check className="size-4 shrink-0 text-blue-600" />
              )}
            </button>
          ))}
          {matchingBanks.length === 0 && (
            <p className="px-3 py-3 text-sm text-slate-500">
              Nenhum banco encontrado.
            </p>
          )}
        </div>
        {customName && !hasExactMatch && (
          <button
            type="button"
            onClick={() => selectBank(customName)}
            className="mt-2 w-full rounded-lg border-t border-slate-100 px-3 py-2 text-left text-sm font-medium text-blue-700 hover:bg-blue-50"
          >
            Usar “{customName}”
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}

function normalize(value: string) {
  return value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
