import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { cookies } from 'next/headers';

// Endpoint para obtener el balance de una subcuenta específica
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Obtener el ID de la subcuenta desde los parámetros de la URL
    const subaccountId = params.id;
    
    if (!subaccountId) {
      return NextResponse.json(
        { error: 'ID de subcuenta no especificado' },
        { status: 400 }
      );
    }

    // Verificar la autenticación
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Llamar a la función RPC para obtener el balance
    const { data, error } = await supabase.rpc('get_subaccount_balance', {
      p_subaccount_id: subaccountId
    });

    if (error) {
      console.error('Error al obtener balance:', error);
      return NextResponse.json(
        { error: error.message || 'Error interno del servidor' },
        { status: 500 }
      );
    }

    // Verificar si hay un error en la respuesta de la función
    if (data && !data.success) {
      return NextResponse.json(
        { error: data.error || 'Error desconocido' },
        { status: 400 }
      );
    }

    // Devolver los datos de balance y activos
    return NextResponse.json({
      balance: data.balance || 0,
      assets: data.assets || [],
      success: true
    });
    
  } catch (error: any) {
    console.error('Error no controlado en la API:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Error interno del servidor',
        success: false 
      },
      { status: 500 }
    );
  }
} 