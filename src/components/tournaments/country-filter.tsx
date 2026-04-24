"use client";

import type { CountryFilter } from "@/types/tournament";

const countries = [
  { value: "Lithuania", label: "🇱🇹 Lithuania" },
  { value: "Latvia", label: "🇱🇻 Latvia" },
];

interface CountryFilterProps {
  selected: CountryFilter;
  onChange: (value: CountryFilter) => void;
}

export function CountryFilter({ selected, onChange }: CountryFilterProps) {
  const toggleCountry = (country: "Lithuania" | "Latvia") => {
    const newSelected = selected.includes(country)
      ? selected.filter((c) => c !== country)
      : [...selected, country];
    onChange(newSelected);
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-2 flex-wrap">
        {countries.map((country) => {
          const isSelected = selected.includes(country.value as "Lithuania" | "Latvia");
          return (
            <button
              key={country.value}
              onClick={() => toggleCountry(country.value as "Lithuania" | "Latvia")}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                isSelected
                  ? "bg-amber-600 text-white shadow-md hover:shadow-lg hover:bg-amber-700 active:shadow-sm"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300 shadow-sm hover:shadow-md"
              }`}
            >
              {country.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
