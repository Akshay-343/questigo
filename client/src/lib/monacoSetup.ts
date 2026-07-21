// Bundle Monaco locally (instead of @monaco-editor/react's default CDN load) so the
// code editor works offline and during demos with no network. Imported by the lazy
// CodingChallenge chunk, so Monaco only ships when a coding challenge is opened.
import { loader } from '@monaco-editor/react'
import * as monaco from 'monaco-editor'
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'

// Plain-text editing only — the base editor worker is all we need (no language servers).
self.MonacoEnvironment = {
  getWorker: () => new EditorWorker(),
}

loader.config({ monaco })
