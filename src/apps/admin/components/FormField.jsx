export default function FormField({ label, children }) {
    return (
        <label className="mem-form__field">
            <span className="mem-form__label">{label}</span>
            {children}
        </label>
    );
}
