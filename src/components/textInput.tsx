type Props = {
  value: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  readOnly?: boolean;
};

export const TextInput = ({ value, onChange, readOnly, ...rest }: Props) => {
  return (
    <input
      className="input-base placeholder:text-muted/60 block w-full"
      type="text"
      value={value}
      onChange={onChange}
      readOnly={readOnly}
      {...rest}
    />
  );
};
