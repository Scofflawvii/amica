type Props = {
  value: number;
  min: number;
  max: number;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

export const NumberInput = ({ value, onChange, ...rest }: Props) => {
  return (
    <input
      className="input-base placeholder:text-muted/60 block w-full"
      type="number"
      value={value}
      onChange={onChange}
      {...rest}
    />
  );
};
