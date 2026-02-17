# Best Practices Documentation

This document outlines the coding patterns and best practices extracted from the SupportNeedsApp codebase.

## Table of Contents

1. [TypeScript Patterns](#typescript-patterns)
2. [TypeScript Style (Loops, Branches, UI Changes)](#typescript-style)
3. [React Component Structure](#react-component-structure)
4. [State Management](#state-management)
5. [Fastify Backend](#fastify-backend)
6. [API Project Structure](#api-project-structure)
7. [pnpm Monorepo Setup](#pnpm-monorepo-setup)

---

## TypeScript Patterns

### Schema-First Design

Zod schemas are the single source of truth for data validation. Types are derived using `z.infer`:

```typescript
// apps/web/src/common/schemas/adjustments.ts
export const newAdjustmentSchema = z.object({
  code: itemCodeSchema,
  type: z.nativeEnum(AdjustmentTypeCode),
  necPeatCode: z.string(),
  name: z.string(),
  isActive: z.boolean(),
});

// apps/web/src/common/types/adjustments.ts
export type NewAdjustment = z.infer<typeof newAdjustmentSchema>;
export type Adjustment = WithAuditProps<NewAdjustment>;
```

### Generic Constraints

Use `extends` for type-safe generics:

```typescript
// apps/web/src/common/types/data.ts
export type ReferenceListItem<TCode extends string = string> = {
  code: TCode;
  description: string;
  isActive: boolean;
};

// apps/web/src/common/utils/person.ts
export const isPersonApplicantOnly = <
  TPerson extends Pick<PersonSearchResult, 'isApplicant' | 'isHouseholdMember'>,
>({ isApplicant, isHouseholdMember }: TPerson) => isApplicant && !isHouseholdMember;
```

### Utility Types

Custom utility types for reusable patterns:

```typescript
// apps/web/src/common/types/db.ts
export type WithAuditProps<TData extends object> = TData & {
  createdBy: string;
  modifiedBy?: string;
  created: Date;
  modified?: Date;
};

// apps/web/src/client/store/createStore.ts
export type StateValues<TState extends StoreState> = Omit<TState, PropertiesOfType<TState, Function>>;
export type StateActions<TState extends StoreState> = Pick<TState, PropertiesOfType<TState, Function>>;
```

### The `satisfies` Keyword

Use `satisfies` for type checking without type widening:

```typescript
// apps/web/src/api/app/contentManagement/EnsureNecAttributeIsValidCommand.ts
const adjustmentCategories = {
  [AdjustmentTypeCode.Reasonable]: PersonAttributeCategoryCode.ReasonableAdjustment,
  [AdjustmentTypeCode.Communication]: PersonAttributeCategoryCode.CommunicationAdjustment,
} as const satisfies Record<AdjustmentTypeCode, BooleanPersonAttributeCategoryCode>;
```

### Module Augmentation

Extend framework types via declaration files:

```typescript
// apps/web/src/common/types/_fastify.d.ts
declare module 'fastify' {
  interface Session {
    loginRedirectUri?: string;
    user?: User;
  }
}

declare module '@fastify/request-context' {
  interface RequestContextData {
    log: FastifyBaseLogger;
    session: Session;
  }
}
```

### Type-Safe tRPC

Full type safety from backend to frontend:

```typescript
// apps/web/src/api/trpc/index.ts
export interface TRPCContext extends CreateFastifyContextOptions {
  user?: User;
}

export const protectedProcedure = appProcedure.use(({ path, ctx: { user }, next }) => {
  if (!user) throw new TRPCError({ code: 'UNAUTHORIZED' });
  return next({ ctx: { user } }); // Type narrows user to non-nullable
});

// apps/web/src/client/lib/trpc.ts
export const api = createTRPCReact<TRPCRouter>();
```

---

## TypeScript Style

### Loop Patterns

**Preferred: Functional array methods over traditional loops**

| Pattern | Use Case |
|---------|----------|
| `.map()` | Transform arrays, render lists |
| `.filter()` | Select subset of items |
| `.reduce()` | Accumulate values, build objects |
| `keyBy`/`groupBy` (lodash) | Index data by key |

```typescript
// apps/web/src/client/components/containers/PersonPage/PersonPage.tsx
{(Object.entries(person.propertyHazards) as [PropertyHazardCode, boolean][]).map(
  ([hazardCode, hasHazard]) =>
    hasHazard && <div key={hazardCode}>{propertyHazardDisplayValues[hazardCode]}</div>,
)}

// apps/web/src/client/utils/data.tsx
export const referenceListToDisplayValuesMap = <TValue extends string>(
  list: ReferenceListItem<TValue>[] = [],
): DisplayValuesMap<TValue> =>
  list.reduce(
    (map, { code, description }) => ({ ...map, [code]: description }),
    {} as DisplayValuesMap,
  );

// apps/web/src/client/components/containers/PersonPage/SupportNeedList/SupportNeedList.tsx
const questionsBySupportNeedCode = useMemo(
  () => groupBy(supportNeedQuestions, 'supportNeedCode'),
  [supportNeedQuestions],
);
```

**Avoid: Traditional `for` loops, `for...of`, `forEach`**

### Branching Patterns

**Ternary operators for simple conditionals in JSX:**

```typescript
// apps/web/src/client/components/containers/PersonPage/PersonPage.tsx
{person?.pcfraStatusDescription || (isApplicantOnly ? 'Not applicable' : 'None')}
```

**Optional chaining (`?.`) and nullish coalescing (`??`):**

```typescript
// apps/web/src/client/components/containers/PersonPage/PersonPage.tsx
const advocateCount = tenantAdvocates?.length ?? 0;
const activeAdvocateCount = tenantAdvocates?.filter(({ ended }) => !ended).length ?? 0;
```

**Guard clauses for early returns:**

```typescript
// apps/web/src/client/utils/supportNeeds.ts
export const parseArrayAnswerValue = (value?: string) => {
  if (value) {
    try {
      return JSON.parse(value) as string[];
    } catch (err) {
      console.warn('Failed to parse array answer value', { value });
    }
  }
  return [];
};
```

**Logical operators for conditional rendering:**

```typescript
// apps/web/src/client/components/containers/PersonPage/SupportNeedList/SupportNeedList.tsx
{!personSupportNeeds.length && (
  <Text variant="body1Responsive">
    There are no active support needs recorded for this resident.
  </Text>
)}

{supportNeedExampleInfo && (
  <ExampleInfo variant="body2Responsive">{supportNeedExampleInfo}</ExampleInfo>
)}
```

### UI Change Handling

**useState with immutable updates:**

```typescript
// apps/web/src/client/components/shared/PersonAdjustmentsForm/usePersonAdjustmentsForm.tsx
const [updatedAdjustments, setUpdatedAdjustments] = useState<PersonAdjustmentCodeLists>({
  [AdjustmentTypeCode.Reasonable]: [],
  [AdjustmentTypeCode.Communication]: [],
  [AdjustmentTypeCode.CommunicationPreference]: [],
});

const onListChange = (type: AdjustmentTypeCode, value: string[]) => {
  setHasChanges(true);
  setUpdatedAdjustments((current) => ({ ...current, [type]: value }));
};
```

**useEffect for synchronization:**

```typescript
// apps/web/src/client/components/containers/PersonPage/usePersonPageData.ts
useEffect(() => {
  if (person) {
    addToPendingUserList(...extractCamdenAccountNames([person], ['modifiedBy', 'reviewedBy']));
  }
}, [person]);
```

**useMemo for expensive computations:**

```typescript
// apps/web/src/client/components/containers/LogCircumstancesPage/SupportNeedForm/SupportNeedForm.tsx
const supportNeedOptions = useMemo(
  () => getGroupedSupportNeedOptions(supportNeedTypeList, supportNeedList),
  [supportNeedTypeList, supportNeedList],
);

const questionsConfig = useMemo(
  () => buildSupportNeedQuestionsFormSchemaAndConfig({
    supportNeedOptions,
    additionalInfo,
    questions,
    questionOptions,
    personSupportNeedCodes,
  }),
  [supportNeedCode, supportNeedOptions, questions, questionOptions],
);
```

**useCallback for stable function references:**

```typescript
// apps/web/src/client/components/containers/PersonPage/EndPersonSupportNeedDialog/useEndPersonSupportNeedDialog.tsx
const showEndPersonSupportNeedDialog = useCallback((selectedNeed: PersonSupportNeed) => {
  setPersonSupportNeed(selectedNeed);
  show();
}, []);
```

**Mutations with tRPC:**

```typescript
// apps/web/src/client/components/containers/EditAdjustmentsPage/EditAdjustmentsPage.tsx
const { mutateAsync: updatePersonAdjustments, isPending: isSaving } =
  api.updatePersonAdjustments.useMutation({ onSuccess: onPersonUpdated });

const onClickSave = async () => {
  await updatePersonAdjustments({
    personId,
    adjustmentCodes: Object.values(updatedAdjustments).flat(),
  });
  navigate(toPersonPage(personId));
};
```

### Functional Programming Style

**Pure functions for data transformation:**

```typescript
// apps/web/src/client/utils/supportNeeds.ts
export const getGroupedSupportNeedOptions = (
  supportNeedTypeList?: ReferenceListItem[],
  supportNeedList?: SupportNeed[],
): AutocompleteOptionGroup<SupportNeed>[] =>
  !supportNeedTypeList || !supportNeedList
    ? []
    : supportNeedTypeList.map((type) => ({
        groupId: type.code,
        label: type.description,
        options: supportNeedList.filter((need) => need.supportNeedTypeCode === type.code),
      }));
```

**Higher-order functions for render customization:**

```typescript
// apps/web/src/client/components/shared/PersonAdjustmentsForm/useAdjustmentData.tsx
const getRenderAdjustmentLabel =
  (recommendedAdjustmentCodes: string[] = []) =>
  ({ code, description }: ReferenceListItem<string>) => (
    <>
      {description}
      {recommendedAdjustmentCodes.includes(code) && (
        <span css={(theme) => [theme.text.body2Responsive, { color: theme.colors.accent }]}>
          {' '}(recommended)
        </span>
      )}
    </>
  );
```

---

## React Component Structure

### Three-Tier Organization

```
components/
├── common/        # Generic, reusable UI components
├── shared/        # Application-wide shared components
└── containers/    # Page-level components with business logic
```

### File Co-location Pattern

Each component directory contains:

```
PersonAdjustmentsForm/
├── PersonAdjustmentsForm.tsx        # Main component
├── PersonAdjustmentsForm.styled.ts  # Emotion styles
├── usePersonAdjustmentsForm.tsx     # Container hook
├── useAdjustmentData.tsx            # Data fetching hook
└── index.ts                         # Barrel export
```

### Presentational Components

Pure components that receive all data via props:

```typescript
// apps/web/src/client/components/shared/PersonAdjustmentsForm/PersonAdjustmentsForm.tsx
export type PersonAdjustmentsFormProps = {
  /** @default 'h3Responsive' */
  headingTextVariant?: TextProps['variant'];
  reasonableAdjustmentOptions: MultiCheckboxOption[];
  communicationAdjustmentOptions: MultiCheckboxOption[];
  value: PersonAdjustmentCodeLists;
  onListChange(type: AdjustmentTypeCode, value: string[]): void;
};

export const PersonAdjustmentsForm: FunctionComponent<PersonAdjustmentsFormProps> = ({
  headingTextVariant = 'h3Responsive',
  reasonableAdjustmentOptions,
  // ...
}) => (
  // Pure JSX rendering
);
```

### Compound Hooks (Return Component + State)

Hooks that return both state and a pre-rendered component:

```typescript
// apps/web/src/client/components/shared/PersonAdjustmentsForm/usePersonAdjustmentsForm.tsx
export const usePersonAdjustmentsForm = ({
  personId,
  personSupportNeedCodes,
}: UsePersonAdjustmentsFormParams) => {
  const { isLoading, personAdjustmentCodeLists, ...adjustmentOptions } =
    useAdjustmentData(personId, { /* ... */ });

  const [hasChanges, setHasChanges] = useState(false);
  const [updatedAdjustments, setUpdatedAdjustments] = useState<PersonAdjustmentCodeLists>({});

  const form = (
    <PersonAdjustmentsForm
      {...adjustmentOptions}
      value={updatedAdjustments}
      onListChange={onListChange}
    />
  );

  return { isLoading, updatedAdjustments, hasChanges, form };
};
```

### Styling with Emotion

Styles in separate `.styled.ts` files:

```typescript
// apps/web/src/client/components/shared/PersonAdjustmentsForm/PersonAdjustmentsForm.styled.ts
import styled from '@emotion/styled';
import { pxToRem } from '@lbcamden/lib-react';

export const FormSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(3)};
  width: 100%;
  max-width: ${pxToRem(970)};
`;

export const AdjustmentOptions = styled(MultiCheckbox<string>)`
  ${({ theme }) => theme.text.body1Responsive};
  grid-template-columns: repeat(auto-fit, minmax(${pxToRem(340)}, 1fr));
`;
```

**Transient props pattern** (prevent DOM attribute warnings):

```typescript
export const AppBodyContent = styled('div', withTransientProps)<{ $reducedWidth?: boolean }>`
  ${({ $reducedWidth }) =>
    $reducedWidth && css`
      > * { max-width: ${pxToRem(maxReducedBodyWidthPx)}; }
    `}
`;
```

---

## State Management

### Zustand for UI State

Custom store factory with devtools:

```typescript
// apps/web/src/client/store/createStore.ts
export const createStore = <TState extends StoreState>(
  name: string,
  initialState: StateValues<TState>,
  getActions: GetStoreActionsFn<TState>,
) =>
  create<TState>()(
    devtools(
      (set, get) => {
        const actions = getActions(set, get);
        return <TState>{
          ...initialState,
          ...actions,
          clear: () => set(({ cleanup }) => {
            cleanup?.();
            return <TState>{ ...initialState, ...actions };
          }, true),
        };
      },
      { name },
    ),
  );

// apps/web/src/client/store/app/appStore.ts
export const useAppStore = createStore<AppState>(
  'app',
  { isEmbedded, isHomeVisitsReferral },
  (set) => ({
    setUser: (user) => set({ user }),
    setLoginRedirectUri: (uri) => set({ loginRedirectUri: uri }),
  }),
);
```

### TanStack Query for Server State

**Conditional queries with skipToken:**

```typescript
// apps/web/src/client/components/containers/PersonPage/usePersonPageData.ts
const questionsQueryInput = personSupportNeedCodes
  ? { supportNeedCode: personSupportNeedCodes, isActive: true }
  : skipToken;

const supportNeedQuestions = api.supportNeedQuestions.useQuery(questionsQueryInput).data;
```

**Delayed invalidation for async operations:**

```typescript
// apps/web/src/client/hooks/queryHooks.ts
export const useOnPersonUpdated = (personId?: number) => {
  const utils = api.useUtils();
  return () => personId && setTimeout(() => utils.person.invalidate({ personId }), 1500);
};
```

### Selector Pattern

Fine-grained subscriptions:

```typescript
// apps/web/src/client/hooks/storeHooks/storeSelectorHooks.ts
export const useCurrentUser = () => useAppStore(({ user }) => user);

export const useRoleInformation = () => {
  const { roles } = useCurrentUser() || {};
  return useMemo(() => {
    if (!roles) return {};
    const isAdmin = roles.includes('Admin');
    const isElevated = isAdmin || roles.includes('Elevated');
    return { isAdmin, isAdvocacy: isElevated || roles.includes('Advocacy'), isElevated };
  }, [roles]);
};
```

---

## Fastify Backend

### Plugin Architecture

Sequential plugin registration:

```typescript
// apps/web/src/server.ts
server.register(fastifyRequestContext);
server.register(fastifyCookie);
server.register(fastifySession, { /* config */ });
server.register(serverRoutes, { db });
```

### Request Lifecycle Hooks

```typescript
// apps/web/src/server.ts
server.addHook('onRequest', (req, reply, done) => {
  (reply as FastifyReplyWithTime).startTime = performance.now();
  const currentReqLogger = req.log.child({ reqId: req.id });
  req.requestContext.set('log', currentReqLogger);
  req.requestContext.set('session', req.session);
  done();
});

server.addHook('onSend', (_req, reply, payload, done) => {
  reply.header('x-content-type-options', 'nosniff');
  reply.header('referrer-policy', 'origin');
  done(null, payload);
});

server.addHook('onResponse', (req, reply, done) => {
  getCurrentRequestLogger().trace({
    url: req.raw.url,
    statusCode: reply.raw.statusCode,
    durationMs: performance.now() - (reply as FastifyReplyWithTime).startTime,
  }, 'request completed');
  done();
});
```

### Route Organization

Nested plugins with prefix:

```typescript
// apps/web/src/api/routes.ts
const authRoutes: FastifyPluginCallback = (server, _opts, done) => {
  server.get('/login', login);
  server.get('/callback', authCodeCallback);
  server.get('/logout', logout);
  done();
};

export const serverRoutes: FastifyPluginCallback<RoutesOptions> = (server, { db }, done) => {
  server.get('/health', healthCheck);
  server.register(authRoutes, { prefix: '/auth' });
  server.register(apiRoutes, { db, prefix: '/api' });
  done();
};
```

### tRPC Integration

```typescript
// apps/web/src/api/routes.ts
server.register(fastifyTRPCPlugin, {
  prefix: '/trpc',
  trpcOptions: {
    createContext,
    router: trpcRouter,
    onError: ({ req, path, error }) =>
      req.log.error(error, `Error in tRPC handler on path '${path}'`),
  },
});
```

---

## API Project Structure

### Domain Module Organization

```
api/app/
├── adjustments/
│   ├── adjustmentProcedures.ts    # tRPC entry points
│   ├── _registerHandlers.ts       # Handler registration
│   └── types.ts                   # Domain types
├── advocates/
├── people/
├── supportNeeds/
└── ...
```

### Command/Query/Workflow Pattern

**Query (Read operations):**

```typescript
// apps/web/src/api/integrations/gtdb/adjustments/PersonAdjustmentsQuery.ts
export class PersonAdjustmentsQuery extends Query<
  PersonAdjustmentsQueryInput,
  AppResult<PersonAdjustment[]>
> {
  public static async handle(
    { input: { personId } }: PersonAdjustmentsQuery,
    db: MssqlDb,
  ): AsyncAppResult<PersonAdjustment[]> {
    return pipe(
      getQueryAR('personAdjustments'),
      AR.flatMap((queryText) => db.executeQuery<GtdbPersonAdjustment>(queryText, { person_ids: JSON.stringify(ensureArray(personId)) })),
      AR.map((results) => results.map(mapToAdjustmentPreference)),
    );
  }
}
```

**Command (Write operations):**

```typescript
// apps/web/src/api/app/supportNeeds/SendPcfraFollowUpEmailCommand.ts
export class SendPcfraFollowUpEmailCommand extends Command<
  SendPcfraFollowUpEmailCommandInput,
  AppResult<void>
> {
  public static async handle(
    { input: { user, person, supportNeedsCreated } }: SendPcfraFollowUpEmailCommand,
    run: RunFunction,
  ): Promise<AppResult<void>> {
    return run(new SendEmailCommand({ /* params */ }));
  }
}
```

**Workflow (Complex orchestration):**

```typescript
// apps/web/src/api/app/supportNeeds/CreatePersonSupportNeedsWorkflow.ts
export class CreatePersonSupportNeedsWorkflow extends Workflow<
  CreatePersonSupportNeedsWorkflowInput,
  AppResult<CreatePersonSupportNeedsWorkflowResult>
> {
  public static async handle(
    { input: { user, payload } }: CreatePersonSupportNeedsWorkflow,
    run: RunFunction,
  ): AsyncAppResult<CreatePersonSupportNeedsWorkflowResult> {
    return pipe(
      run(new InsertPersonSupportNeedsAndAnswersWorkflow({...})),
      AR.flatMap((ids) => AR.map(
        asyncAll([
          run(new PersonQuery({...})),
          run(new PersonSupportNeedListQuery({...})),
        ]),
        ([person, needs]) => ({...}),
      )),
      AR.tap(() => run(new SendPcfraFollowUpEmailCommand({...}))),
    );
  }
}
```

### Functional Composition with ts-belt

```typescript
import { pipe } from '@mobily/ts-belt';
import { AR } from '@mobily/ts-belt/AsyncResult';

return pipe(
  run(new SomeQuery(input)),
  AR.flatMap((result) => run(new AnotherQuery(result))),
  AR.map((data) => transformData(data)),
  AR.tap(logSuccess),
  AR.tapError(logError),
);
```

### Role-Based Authorization

```typescript
// apps/web/src/api/trpc/procedureAuth.ts
export const procedureNonAdminRolesMap: Record<ProcedureName, AppRole[] | 'any'> = {
  appVersion: 'any',
  user: 'any',
  createAdvocate: ['Elevated', 'Advocacy'],
  updateSupportNeedType: ['Elevated'],
};

export const hasProtectedProcedureAuth = (procedureName: string, { roles }: User): boolean => {
  const procedureRoles = procedureNonAdminRolesMap[procedureName as ProcedureName];
  return procedureRoles === 'any' || roles.some((role) => ['Admin', ...procedureRoles].includes(role));
};
```

---

## pnpm Monorepo Setup

### Workspace Configuration

```yaml
# pnpm-workspace.yaml
packages:
  - "apps/*"
  - "packages/*"
```

### Root package.json

```json
{
  "name": "support-needs",
  "private": true,
  "type": "module",
  "packageManager": "pnpm@10.5.2",
  "engines": { "node": ">=22" },
  "scripts": {
    "dev": "turbo dev --env-mode=loose",
    "build": "turbo build --env-mode=loose",
    "test": "vitest run",
    "lint": "pnpm lint:packages && turbo eslint && turbo stylelint"
  }
}
```

### Turborepo Configuration

```json
// turbo.json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["$TURBO_DEFAULT$", ".env*"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

### External Package References

GitHub monorepo references with version pinning:

```json
{
  "@lbcamden/lib-react": "github:LBCamden/ts-packages#path:/packages/lib-react&lib-react_1.87.1",
  "@lbcamden/commander": "github:LBCamden/ts-packages#path:/packages/commander",
  "@lbcamden/mssql-client": "github:LBCamden/ts-packages#path:/packages/mssql-client&mssql-client_1.3.0"
}
```

### Path Aliases

```json
// apps/web/tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "~/*": ["src/*"],
      "~vitest/*": ["vitest/*"]
    }
  }
}
```

### Vitest Workspace

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    projects: [
      { name: 'web-client', root: 'apps/web/src/client', environment: 'happy-dom' },
      { name: 'web-api', root: 'apps/web/src/api', environment: 'node' },
      { name: 'web-api-integration', root: 'apps/web/tests/api', environment: 'node' }
    ]
  }
});
```

### Build Configuration

**Vite** for client, **esbuild** for API:

```javascript
// apps/web/esbuild.config.js
const options = {
  bundle: true,
  platform: 'node',
  outfile: 'dist/index.mjs',
  format: 'esm',
  external: ['oracledb', '@fastify/vite', 'lightningcss']
};
```

---

## Quick Reference

| Area | Pattern | Example Location |
|------|---------|------------------|
| Types from schemas | `z.infer<typeof schema>` | `common/types/*.ts` |
| Loops | `.map()`, `.filter()`, `.reduce()` | `client/utils/data.tsx` |
| Conditionals | Ternary, `?.`, `??`, `&&` | `client/components/**/*.tsx` |
| Component hooks | `useSomethingForm` returning `{ form, state }` | `client/components/shared/*/use*.tsx` |
| Styles | Separate `.styled.ts` files | `client/components/**/*.styled.ts` |
| UI state | Zustand with `createStore` factory | `client/store/*.ts` |
| Server state | tRPC + TanStack Query | `client/lib/trpc.ts` |
| API procedures | `protectedProcedure.input(schema).query/mutation` | `api/app/*/procedures.ts` |
| Domain logic | Query/Command/Workflow classes | `api/app/*/*.ts` |
| Composition | ts-belt `pipe`, `AR.flatMap`, `AR.map` | `api/**/*.ts` |
