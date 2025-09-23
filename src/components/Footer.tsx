import { Link } from 'react-router-dom'

export const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="mt-auto border-t bg-card px-4 py-4 text-center text-sm text-muted-foreground md:px-6">
      <div className="container mx-auto flex flex-col items-center justify-between gap-2 sm:flex-row">
        <p>&copy; {currentYear} StudyPal. Todos os direitos reservados.</p>
        <nav className="flex gap-4 sm:gap-6">
          <Link to="#" className="hover:text-primary">
            Termos de Serviço
          </Link>
          <Link to="#" className="hover:text-primary">
            Política de Privacidade
          </Link>
        </nav>
      </div>
    </footer>
  )
}
