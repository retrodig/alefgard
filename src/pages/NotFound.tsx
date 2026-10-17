import { Link } from 'react-router'
import { Window } from '../components/Window'

export function NotFound() {
  return (
    <Window title="404">
      <p>そのばしょには なにもない。</p>
      <Link to="/">▶ もどる</Link>
    </Window>
  )
}
