export default function Digit({ dial, number }) {
  return (
    <div onClick={() => dial(number)}>
      <button type="button">{number}</button>
    </div>
  );
}
