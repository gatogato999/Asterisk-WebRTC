import Digit from "./DigitDial.jsx";
export default function NumPad({ dial }) {
  return (
    <div className="dial-pad">
      <Digit dial={dial} number={1} />
      <Digit dial={dial} number={2} />
      <Digit dial={dial} number={3} />
      <Digit dial={dial} number={4} />
      <Digit dial={dial} number={5} />
      <Digit dial={dial} number={6} />
      <Digit dial={dial} number={7} />
      <Digit dial={dial} number={8} />
      <Digit dial={dial} number={9} />
      <span />
      <Digit dial={dial} number={0} />
      <span />
    </div>
  );
}
