import { useState } from 'react'
import type { KeyboardEvent } from 'react'
import { validateCategoryName } from './validateCategory'
import styles from './CategoryManager.module.css'

interface CategoryManagerProps {
  categories: string[]
  /** 返回的 Promise 失败表示保存失败 */
  onChange: (categories: string[]) => Promise<unknown> | undefined
}

interface RowProps {
  name: string
  /** 其他分类（用于重命名时查重） */
  others: string[]
  onRename: (next: string) => void
  onDelete: () => void
}

/** 单个分类：直接编辑名称，回车或失焦提交，Esc 放弃修改。 */
function CategoryRow({ name, others, onRename, onDelete }: RowProps) {
  const [draft, setDraft] = useState(name)
  const [error, setError] = useState<string | null>(null)

  const commit = () => {
    if (draft === name) return setError(null)
    const message = validateCategoryName(draft, others)
    if (message) return setError(message)
    setError(null)
    onRename(draft) // 名称变化后父组件会以新名称为 key 重建本行
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur() // 触发 onBlur 提交
    } else if (e.key === 'Escape') {
      setDraft(name)
      setError(null)
    }
  }

  return (
    <li>
      <div className={styles.row}>
        <input
          className={`${styles.input} ${error ? styles.invalid : ''}`}
          value={draft}
          aria-label={`分类 ${name}`}
          aria-invalid={error !== null}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKeyDown}
        />
        <button
          type="button"
          className={`${styles.button} ${styles.danger}`}
          aria-label={`删除分类 ${name}`}
          onClick={onDelete}
        >
          删除
        </button>
      </div>
      {error && <p className={styles.error}>{error}</p>}
    </li>
  )
}

/** 分类管理：添加、修改（重命名）、删除分类。 */
export function CategoryManager({ categories, onChange }: CategoryManagerProps) {
  const [newName, setNewName] = useState('')
  const [addError, setAddError] = useState<string | null>(null)

  const save = (next: string[]) => {
    onChange(next)?.catch(() => setAddError('保存失败，请重试'))
  }

  const add = () => {
    const name = newName.trim()
    if (name === '' && newName === '') return
    const message = validateCategoryName(name, categories)
    if (message) return setAddError(message)
    setAddError(null)
    setNewName('')
    save([...categories, name])
  }

  return (
    <div>
      {categories.length === 0 ? (
        <p className={styles.empty}>还没有分类，在下方添加。</p>
      ) : (
        <ul className={styles.list}>
          {categories.map((name) => (
            <CategoryRow
              key={name}
              name={name}
              others={categories.filter((c) => c !== name)}
              onRename={(next) => save(categories.map((c) => (c === name ? next : c)))}
              onDelete={() => save(categories.filter((c) => c !== name))}
            />
          ))}
        </ul>
      )}

      <div className={`${styles.row} ${styles.add}`}>
        <input
          className={`${styles.input} ${addError ? styles.invalid : ''}`}
          value={newName}
          placeholder="新分类名称"
          aria-label="新分类名称"
          aria-invalid={addError !== null}
          onChange={(e) => {
            setNewName(e.target.value)
            setAddError(null)
          }}
          onKeyDown={(e) => e.key === 'Enter' && add()}
        />
        <button type="button" className={styles.button} onClick={add}>
          添加
        </button>
      </div>
      {addError && <p className={styles.error}>{addError}</p>}
    </div>
  )
}
