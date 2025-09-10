import { useTranslation } from "react-i18next";

type RangeProps = {
  min: number;
  max: number;
  minChange?: (event: React.ChangeEvent<HTMLInputElement>, type: "min") => void;
  maxChange?: (event: React.ChangeEvent<HTMLInputElement>, type: "max") => void;
};

export const RangeInput = ({ min, max, minChange, maxChange }: RangeProps) => {
  const { t } = useTranslation();

  const handleMinChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (minChange) minChange(event, "min");
  };

  const handleMaxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (maxChange) maxChange(event, "max");
  };

  return (
    <div className="flex space-x-2">
      <label className="flex items-center">
        <span className="text-small text mr-2 block leading-6 font-medium">{`${t("Min")}`}</span>
        <input
          className="input-base placeholder:text-muted/60 w-32"
          type="number"
          value={min}
          onChange={handleMinChange}
          placeholder="Min"
          min={0}
          max={max - 1}
        />
      </label>
      <label className="flex items-center">
        <span className="text-small text mr-2 block leading-6 font-medium">{`${t("Max")}`}</span>
        <input
          className="input-base placeholder:text-muted/60 w-32"
          type="number"
          value={max}
          onChange={handleMaxChange}
          placeholder="Max"
          min={min + 1}
          max={3600}
        />
      </label>
    </div>
  );
};
