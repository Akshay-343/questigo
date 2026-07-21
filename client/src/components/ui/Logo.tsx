// Questigo logo mark.
//
// The artwork lives in a single editable file: client/public/logo.svg
// Edit that file to change the logo EVERYWHERE — it is used both as the
// browser tab/favicon (see client/index.html) and across the app via this
// component.
export function LogoMark({ className }: { className?: string }) {
  return <img src="/logo.svg" alt="Questigo" className={className} draggable={false} />
}
