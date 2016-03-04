
function RconService()
{
	var s = {};

	s.Callbacks = {};

	// A list of untargetted ouput from the server
	// ie - the console history
	s.Output = new Array();

	s.Connect = function ( addr, pass )
	{
		s.Socket = new WebSocket( "ws://" + addr + "/" + pass );
		s.Address = addr;

		s.Socket.onmessage = function ( e )
		{
			var data = angular.fromJson( e.data );

			//
			// This is a targetted message, it has an identifier
			// So feed it back to the right callback.
			//
			if ( data.Identifier != 0 )
			{
				var cb = s.Callbacks[data.Identifier];
				if ( cb != null )
				{
					cb.scope.$apply( function ()
					{
						cb.callback( data );
					} );
				}
				s.Callbacks[data.Identifier] = null;

				return;
			}

			//
			// Generic console message, let OnMessage catch it
			//
			if ( s.OnMessage != null )
			{
				s.Output.push( data );
				s.OnMessage( data );
			}
		};

		s.Socket.onopen = s.OnOpen;
		s.Socket.onclose = s.OnClose;
		s.Socket.onerror = s.OnError;
	}

	s.Command = function ( msg, identifier )
	{
		if ( identifier == null )
			identifier = -1;

		var packet =
			{
				Identifier: identifier,
				Message: msg,
				Name: "WebRcon"
			}

		s.Socket.send( JSON.stringify( packet ) );
	};

	var LastIndex = 1001;

	//
	// Make a request, call this function when it returns
	//
	s.Request = function ( msg, scope, callback )
	{
		LastIndex++;
		s.Callbacks[LastIndex] = { scope: scope, callback: callback };
		s.Command( msg, LastIndex );
	}

	//
	// Returns true if websocket is connected
	//
	s.IsConnected = function ()
	{
		if ( s.Socket == null ) return false;
		return s.Socket.readyState == 1;
	}

	//
	// Helper for installing connectivity logic
	//
	// Basically if not connected, call this function when we are
	// And if we are - then call it right now.
	//
	s.InstallService = function( scope, func )
	{
		scope.$on( "OnConnected", function ()
		{
			func();
		});

		if ( s.IsConnected() )
		{
			func();
		}
	}

	return s;
}