export const GeneralButton = ({text, onClick}) => {
    const onPressButton = () => {
        onClick();
    }

    return (
        <button onClick={onPressButton}>{text}</button>
    )
}