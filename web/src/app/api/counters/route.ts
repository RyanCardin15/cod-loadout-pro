import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/admin';
import { logger } from '@/lib/logger';
import { validateQuery, handleApiError } from '@/lib/utils/validation';
import { counterQuerySchema } from '@/lib/validation/schemas';
import { normalizeWeapon, normalizeWeapons } from '@/lib/utils/weapon-normalizer';

// Force dynamic rendering to prevent static generation during build
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Validate query parameters
    const { weaponId, limit } = validateQuery(request, counterQuerySchema);

    // Get the enemy weapon
    const weaponDoc = await db().collection('weapons').doc(weaponId).get();

    if (!weaponDoc.exists) {
      return NextResponse.json(
        { error: 'Weapon not found' },
        { status: 404 }
      );
    }

    const rawEnemyWeapon = { id: weaponDoc.id, ...weaponDoc.data() } as any;
    // Normalize V3 to V1 for safe stats access
    const enemyWeapon = normalizeWeapon(rawEnemyWeapon);

    // Analyze weapon strengths and weaknesses based on stats
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    if (enemyWeapon.stats.range > 75) strengths.push('Excellent long-range performance');
    if (enemyWeapon.stats.damage > 75) strengths.push('High damage output');
    if (enemyWeapon.stats.accuracy > 75) strengths.push('Superior accuracy');
    if (enemyWeapon.stats.fireRate > 75) strengths.push('Fast fire rate');
    if (enemyWeapon.stats.mobility > 75) strengths.push('High mobility');
    if (enemyWeapon.stats.control > 75) strengths.push('Excellent recoil control');

    if (enemyWeapon.stats.range < 50) weaknesses.push('Limited range');
    if (enemyWeapon.stats.mobility < 50) weaknesses.push('Slow movement speed');
    if (enemyWeapon.stats.fireRate < 50) weaknesses.push('Slow fire rate');
    if (enemyWeapon.stats.handling < 50) weaknesses.push('Slow handling');

    // Find counter weapons - weapons that excel where enemy is weak
    // Note: Removed orderBy to avoid composite index requirement
    let counterQuery: any = db().collection('weapons')
      .where('game', '==', enemyWeapon.game)
      .limit(50);

    const counterSnapshot = await counterQuery.get();
    const rawWeapons = counterSnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }) as any);
    // Normalize all weapons for safe stats access
    const allWeapons = normalizeWeapons(rawWeapons);

    // Score each weapon as a counter
    const counterWeapons = allWeapons
      .map((weapon: any) => {
        let effectiveness = 0;
        let reasoning: string[] = [];

        // Counter based on range advantage
        if (enemyWeapon.stats.range < 50 && weapon.stats.range > 70) {
          effectiveness += 25;
          reasoning.push('Superior range advantage');
        }

        // Counter based on mobility
        if (enemyWeapon.stats.mobility < 50 && weapon.stats.mobility > 70) {
          effectiveness += 20;
          reasoning.push('Better mobility for repositioning');
        }

        // Counter based on TTK/fire rate
        if (enemyWeapon.stats.fireRate < 60 && weapon.stats.fireRate > 75) {
          effectiveness += 25;
          reasoning.push('Faster TTK potential');
        }

        // Category counters
        if (enemyWeapon.category === 'AR' && weapon.category === 'SMG') {
          effectiveness += 15;
          reasoning.push('Close-range SMG advantage');
        }
        if (enemyWeapon.category === 'SMG' && weapon.category === 'AR') {
          effectiveness += 15;
          reasoning.push('Medium-range AR advantage');
        }

        // Tier bonus
        if (weapon.meta.tier === 'S') effectiveness += 10;
        if (weapon.meta.tier === 'A') effectiveness += 5;

        return {
          weaponId: weapon.id,
          weaponName: weapon.name,
          category: weapon.category,
          effectiveness: Math.min(100, effectiveness),
          reasoning: reasoning.join(', ') || 'Solid counter option',
        };
      })
      .filter((w: any) => w.effectiveness >= 40 && w.weaponId !== weaponId)
      .sort((a: any, b: any) => b.effectiveness - a.effectiveness)
      .slice(0, limit);

    // Generate tactical advice
    const strategies = [];
    const tacticalAdvice = [];

    if (enemyWeapon.stats.range > 70) {
      strategies.push('Close the distance quickly to negate range advantage');
      tacticalAdvice.push('Use cover and movement to get within effective range');
    }

    if (enemyWeapon.stats.mobility < 50) {
      strategies.push('Use superior mobility to flank and outmaneuver');
      tacticalAdvice.push('Circle strafe and maintain pressure');
    }

    if (enemyWeapon.category === 'Sniper') {
      strategies.push('Avoid long sightlines and use unpredictable movement');
      tacticalAdvice.push('Push aggressively with tactical equipment');
    }

    return NextResponse.json({
      counterData: {
        enemyWeapon: {
          id: enemyWeapon.id,
          name: enemyWeapon.name,
          category: enemyWeapon.category,
          strengths,
          weaknesses,
        },
        counterWeapons,
        strategies,
        tacticalAdvice,
      },
    });
  } catch (error) {
    logger.apiError('GET', '/api/counters', error);
    return handleApiError(error);
  }
}
