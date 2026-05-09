#!/bin/bash

# Fix unused reply parameters in route files
sed -i 's/async (request, reply)/async (request, _reply)/g' src/routes/auth.routes.ts
sed -i 's/async (request, reply)/async (request, _reply)/g' src/routes/build-in-public.routes.ts
sed -i 's/async (request, reply)/async (request, _reply)/g' src/routes/company-profile.routes.ts
sed -i 's/async (request, reply)/async (request, _reply)/g' src/routes/engineer-profile.routes.ts
sed -i 's/async (request, reply)/async (request, _reply)/g' src/routes/search.routes.ts

# Fix unused request and reply in search.routes.ts
sed -i 's/async (request: FastifyRequest, reply: FastifyReply)/async (_request: FastifyRequest, _reply: FastifyReply)/g' src/routes/search.routes.ts

# Fix unused imports
sed -i 's/buildInPublicActivitySchema,/_buildInPublicActivitySchema,/g' src/routes/engineer-profile.routes.ts
sed -i 's/publishProductSchema,/_publishProductSchema,/g' src/routes/product.routes.ts
sed -i 's/salesByPeriodSchema/_salesByPeriodSchema/g' src/routes/product.routes.ts
sed -i 's/updateTaskSchema/_updateTaskSchema/g' src/routes/task.routes.ts

# Fix unused parameters in services
sed -i 's/escalatedBy: string/_escalatedBy: string/g' src/services/contract-dispute.service.ts
sed -i 's/adminId: string/_adminId: string/g' src/services/dispute.service.ts
sed -i 's/paymentDetails: any/_paymentDetails: any/g' src/services/hourly-billing.service.ts
sed -i 's/userId: string/_userId: string/g' src/services/job-posting.service.ts
sed -i 's/aadhaarNumber: string/_aadhaarNumber: string/g' src/services/kyc.service.ts
sed -i 's/panNumber: string/_panNumber: string/g' src/services/kyc.service.ts
sed -i 's/profile: any/_profile: any/g' src/services/neuron-score.service.ts
sed -i 's/reason: string/_reason: string/g' src/services/proctoring.service.ts
sed -i 's/data: PublishProductInput/_data: PublishProductInput/g' src/services/product.service.ts
sed -i 's/userId?: string/_userId?: string/g' src/services/product.service.ts

# Fix unused variables
sed -i 's/const initialScore = 0;/\/\/ const initialScore = 0;/g' src/services/assessment.service.ts
sed -i 's/} catch (e) {/} catch (_e) {/g' src/services/code-evaluator.service.ts
sed -i 's/testFile: string/_testFile: string/g' src/services/code-evaluator.service.ts
sed -i 's/} catch (error) {/} catch (_error) {/g' src/services/code-evaluator.service.ts
sed -i 's/const currency = /const _currency = /g' src/services/razorpay-escrow.service.ts
sed -i 's/const env = validateEnv();/\/\/ const env = validateEnv();/g' src/workers/task-enrichment-worker.ts
sed -i 's/const taskData = /\/\/ const taskData = /g' src/workers/task-enrichment-worker.ts

# Fix unused in middleware
sed -i 's/reply: FastifyReply/_reply: FastifyReply/g' src/middleware/auth.ts
sed -i 's/reply: FastifyReply/_reply: FastifyReply/g' src/middleware/security.ts
sed -i 's/import { getEnv }/\/\/ import { getEnv }/g' src/middleware/security.ts

echo "All unused variable fixes applied!"
