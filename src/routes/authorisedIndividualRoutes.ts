/**
 * Authorised Individual Routes
 */

import { Router } from 'express';
import {
  getAuthorisedIndividual,
  getConditionalDemo,
  listAuthorisedIndividuals
} from '../controllers/authorisedIndividualController';
import { optionalAuth } from '../middleware/auth.middleware';

const router = Router();

/**
 * GET /api/v1/authorised-individual/list
 * List recent records (for finding test IDs)
 */
router.get('/list', optionalAuth, listAuthorisedIndividuals);

/**
 * GET /api/v1/authorised-individual/:id
 * Fetch and map a single record
 */
router.get('/:id', optionalAuth, getAuthorisedIndividual);

/**
 * GET /api/v1/authorised-individual/:id/conditional-demo
 * Demonstrate conditional logic with detailed explanation
 */
router.get('/:id/conditional-demo', optionalAuth, getConditionalDemo);

export default router;
