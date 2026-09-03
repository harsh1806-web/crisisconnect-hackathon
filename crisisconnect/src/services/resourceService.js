import { supabase, isSupabaseConfigured } from './supabase.js';
import { RESOURCE_STATUS, RESOURCE_TYPES } from '../utils/constants.js';

let localResourcesStore = [];

/**
 * Creates a new relief resource entry (e.g. food packets, oxygen, ambulances, shelters)
 */
export async function createResource(resourceData, currentUser = null) {
  const payload = {
    id: `res_${Date.now()}`,
    name: resourceData.name?.trim() || 'Relief Supply',
    type: resourceData.type || RESOURCE_TYPES.OTHER,
    category: resourceData.category || resourceData.type || 'SUPPLIES',
    quantity: Number(resourceData.quantity) || 0,
    unit: resourceData.unit || 'units',
    status: Number(resourceData.quantity) > 0 ? RESOURCE_STATUS.AVAILABLE : RESOURCE_STATUS.DEPLETED,
    contactPerson: resourceData.contactPerson || currentUser?.displayName || '',
    contactPhone: resourceData.contactPhone || currentUser?.phone || '',
    location: {
      address: resourceData.location?.address || '',
      lat: resourceData.location?.lat ? Number(resourceData.location.lat) : null,
      lng: resourceData.location?.lng ? Number(resourceData.location.lng) : null,
    },
    createdBy: currentUser?.uid || 'anonymous',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  localResourcesStore.unshift(payload);

  if (isSupabaseConfigured) {
    try {
      const { data } = await supabase
        .from('relief_resources')
        .insert({
          name: payload.name,
          category: payload.type,
          quantity: payload.quantity,
          unit: payload.unit,
          location_name: payload.location.address,
          latitude: payload.location.lat,
          longitude: payload.location.lng,
          managed_by: payload.contactPerson,
          contact_phone: payload.contactPhone,
        })
        .select()
        .single();

      if (data) {
        payload.id = data.id;
      }
    } catch (err) {
      console.warn('Supabase createResource fallback:', err.message);
    }
  }

  return payload;
}

/**
 * Subscribes to available relief resources in real-time
 */
export function subscribeToResources(onUpdate) {
  if (isSupabaseConfigured) {
    supabase
      .from('relief_resources')
      .select('*')
      .then(({ data }) => {
        if (data && data.length > 0) {
          const formatted = data.map((r) => ({
            id: r.id,
            name: r.name,
            type: r.category,
            quantity: r.quantity,
            unit: r.unit,
            status: r.quantity > 0 ? RESOURCE_STATUS.AVAILABLE : RESOURCE_STATUS.DEPLETED,
            contactPerson: r.managed_by,
            contactPhone: r.contact_phone,
            location: {
              address: r.location_name,
              lat: r.latitude,
              lng: r.longitude,
            },
          }));
          onUpdate(formatted);
        } else {
          onUpdate(localResourcesStore);
        }
      })
      .catch(() => {
        onUpdate(localResourcesStore);
      });

    const channel = supabase
      .channel('realtime:relief_resources')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'relief_resources' }, () => {
        supabase
          .from('relief_resources')
          .select('*')
          .then(({ data }) => {
            if (data) {
              const formatted = data.map((r) => ({
                id: r.id,
                name: r.name,
                type: r.category,
                quantity: r.quantity,
                unit: r.unit,
                status: r.quantity > 0 ? RESOURCE_STATUS.AVAILABLE : RESOURCE_STATUS.DEPLETED,
                contactPerson: r.managed_by,
                contactPhone: r.contact_phone,
                location: {
                  address: r.location_name,
                  lat: r.latitude,
                  lng: r.longitude,
                },
              }));
              onUpdate(formatted);
            }
          });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  onUpdate(localResourcesStore);
  return () => {};
}

/**
 * Updates quantity of a relief resource
 */
export async function updateResourceQuantity(resourceId, newQuantity) {
  localResourcesStore = localResourcesStore.map((r) =>
    r.id === resourceId
      ? {
          ...r,
          quantity: newQuantity,
          status: newQuantity > 0 ? RESOURCE_STATUS.AVAILABLE : RESOURCE_STATUS.DEPLETED,
          updatedAt: new Date().toISOString(),
        }
      : r
  );

  if (isSupabaseConfigured) {
    try {
      await supabase
        .from('relief_resources')
        .update({
          quantity: newQuantity,
          updated_at: new Date().toISOString(),
        })
        .eq('id', resourceId);
    } catch (err) {
      console.warn('Supabase updateResourceQuantity fallback:', err.message);
    }
  }

  return true;
}

/**
 * Deletes a relief resource
 */
export async function deleteResource(resourceId) {
  localResourcesStore = localResourcesStore.filter((r) => r.id !== resourceId);

  if (isSupabaseConfigured) {
    try {
      await supabase.from('relief_resources').delete().eq('id', resourceId);
    } catch (err) {
      console.warn('Supabase deleteResource fallback:', err.message);
    }
  }

  return true;
}
