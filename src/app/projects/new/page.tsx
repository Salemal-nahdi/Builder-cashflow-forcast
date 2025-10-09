import { CreateProject } from '@/components/create-project'

export const dynamic = 'force-dynamic'

export default function NewProjectPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <CreateProject />
    </div>
  )
}

