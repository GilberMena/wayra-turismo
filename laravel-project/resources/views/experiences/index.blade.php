@extends('layouts.app')

@section('title', 'Experiencias en Nuquí — WAYRA')

@section('content')
<section class="hero" style="background-image:url('{{ asset('img/hero.svg') }}'); height:50vh;">
    <div class="hero-overlay"></div>
    <div class="container hero-content">
        <h1>Experiencias en Nuquí</h1>
        <p class="lead">Conexión profunda con la naturaleza.</p>
    </div>
</section>

<section class="section">
    <div class="container">
        <h2>Lo que vivirás con nosotros</h2>
        
        <div class="grid">
            @foreach($experiences as $experience)
            <article class="card">
                <div class="card-image" style="background-image:linear-gradient(180deg, rgba(0,0,0,.1), rgba(0,0,0,.2)), url('{{ asset('img/' . $experience->image) }}');"></div>
                <h3>{{ $experience->title }}</h3>
                <p>{{ $experience->description }}</p>
                @if($experience->price)
                    <p class="price">{{ $experience->price }}</p>
                @endif
            </article>
            @endforeach
        </div>
    </div>
</section>
@endsection
