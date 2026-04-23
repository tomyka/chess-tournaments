"use client";

import { Badge } from "@/components/ui/badge";
import { Globe } from "lucide-react";
import type { CountryFilter } from "@/types/tournament";

const countries = [
  { value: "Lithuania", label: "Lithuania" },
  { value: "Latvia", label: "Latvia" },
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
      <Globe className="h-4 w-4 text-gray-600" />
      <div className="flex gap-2 flex-wrap">
        {countries.map((country) => (
          <Badge
            key={country.value}
            variant={selected.includes(country.value as "Lithuania" | "Latvia") ? "default" : "outline"}
            className={`cursor-pointer transition-all ${
              selected.includes(country.value as "Lithuania" | "Latvia")
                ? "bg-amber-600 hover:bg-amber-700"
                : "hover:bg-gray-100"
            }`}
            onClick={() => toggleCountry(country.value as "Lithuania" | "Latvia")}
          >
            {country.label}
          </Badge>
        ))}
      </div>
    </div>
  );
}
