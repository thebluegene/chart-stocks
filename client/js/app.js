$(function() {
    var seriesOptions = [],
        seriesCounter = 0,
        stocks = {},
        key = 0;
    var socket = io.connect('https://chart-stocks-2187.herokuapp.com/');
    //var socket = io.connect('https://chart-stock-market-thebluegene.c9users.io/');

    socket.on('add', function(data) {
        var stockPresent = false;
        $('#container').highcharts().addSeries({
            name: data.dataset.dataset_code,
            data: data.dataset.data.reverse()
        });

        makeButton(data.dataset.dataset_code);

        //add stock to stocks object for other clients.
        for (var key in stocks) {
            if (stocks[key] == data.dataset.dataset_code) {
                stockPresent = true;
                break;
            }
        }
        if (stockPresent == false) {
            key = Math.floor((Math.random() * 9999) + 1);
            while (stocks[key]) {
                key++;
            }
            stocks[key] = data.dataset.dataset_code;
        }
        
        $.post('/stocks', stocks, function(res) {
            console.log('POST SUCCESS ', res);
        });
        
        /*$(".update.loader").hide();
        $("#icon").show();
        $("input").prop('disabled', false);
        $('.center button').prop('disabled', false);*/
    });

    socket.on('thisUser', function(){
        $(".update.loader").hide();
        $("#icon").show();
        $("input").prop('disabled', false);
        $('.center button').prop('disabled', false);
    });

    socket.on('remove', function(removed) {
        for (var stock in $('#container').highcharts().series) {
            if ($('#container').highcharts().series[stock].name == removed) {
                $('#container').highcharts().series[stock].remove();
            }
        }
        $('.stock').each(function(index) {
            if ($(this).text().toLowerCase().replace(/\s/g, '') == removed.toLowerCase()) {
                $(this).remove();
            }
        });
        for (var key in stocks) {
            if (stocks[key].toLowerCase() == removed.toLowerCase()) {
                delete stocks[key];
            }
        }
    });

    initiateStocks();

    $('.center button').on('click', function(e) {
        e.preventDefault();
        $("#icon").hide();
        $(".update.loader").show();
        $("input").prop('disabled', true);
        $('.center button').prop('disabled', true);

        search($('#search').val());
    });

    $('#search').keypress(function(e) {
        if (e.which == 13) {
            $("#icon").hide();
            $(".update.loader").show();
            $("input").prop('disabled', true);
            $('.center button').prop('disabled', true);
            var input = this.value;
            search(input);
        }
    });

    $('#stocklist').on('click', '.stock', function() {
        var $removeThis = $(this);
        removeStock($removeThis);
    });

    function removeStock(remove) {
        for (var key in stocks) {
            if (stocks[key].toLowerCase() == remove.text().toLowerCase().replace(/\s/g, '')) {
                socket.emit('remove', stocks[key]);
                delete stocks[key];
                break;
            }
        }
        $.post('/stocks', stocks, function(res) {
            seriesCounter = 0;
        });
    }

    function search(input) {
        key = Math.floor((Math.random() * 9999) + 1);
        while (stocks[key]) {
            key++;
        }
        stocks[key] = input;
        console.log(stocks);

        $.getJSON('https://www.quandl.com/api/v3/datasets/WIKI/' + stocks[key].toLowerCase() + '.json?auth_token=UVRs9dAWy6kioxmmxLFz', function(data) {
                for (var j = 0; j < data.dataset.data.length; j++) {
                    data.dataset.data[j][0] = Date.parse(data.dataset.data[j][0]);
                }
                socket.emit('add', data);
                socket.emit('thisUser');
            })
            .error(function() {
                alert('The stock you input was not found.');
                delete stocks[key];
                $.post('/stocks', stocks);

                $(".update.loader").hide();
                $("#icon").show();
                $("input").prop('disabled', false);
                $('.center button').prop('disabled', false);
            });
        $('input').val('');
    }

    function makeButton(stockName) {
        $('#stocklist').append('<div class = "col-sm-3 stock"><span class="glyphicon glyphicon-remove"></span> ' + stockName + '</div>');
    }

    function addStock(i, name) {
        $(".graph.loader").show();
        $("input").prop('disabled', true);
        $(".center button").prop('disabled', true);
        $('#stocklist').off('click', '.stock');

        $.getJSON('https://www.quandl.com/api/v3/datasets/WIKI/' + name.toLowerCase() + '.json?auth_token=UVRs9dAWy6kioxmmxLFz', function(data) {
            i = parseInt(i, 10);
            for (var j = 0; j < data.dataset.data.length; j++) {
                data.dataset.data[j][0] = Date.parse(data.dataset.data[j][0]);
            }

            seriesOptions[seriesCounter] = {
                name: name,
                data: data.dataset.data.reverse()
            };
            seriesCounter += 1;

            if (seriesCounter === Object.keys(stocks).length) {
                createChart();
                $(".graph.loader").hide();
                $("input").prop('disabled', false);
                $(".center button").prop('disabled', false);

                $('#stocklist').on('click', '.stock', function() {
                    var $removeThis = $(this);
                    removeStock($removeThis);
                });
            }
        });
    }

    function initiateButtons() {
        for (var stock in stocks) {
            makeButton(stocks[stock]);
        }
    }

    function initiateStocks() {
        $.get('/stocks', null, function(data) {
            stocks = data;
            getChartData(data);
            initiateButtons();
        });
    }

    function getChartData(stocks) {
        $.each(stocks, function(i, name) {
            //Need conditional because $.each includes prototype as a key!
            if (isNaN(i)) {
                delete stocks[i];
            }
            if (!isNaN(i)) {
                addStock(i, name);
            }
        });
    }

    function createChart() {
        $('#container').highcharts('StockChart', {
            rangeSelector: {
                selected: 2
            },
            yAxis: {
                labels: {
                    formatter: function() {
                        return '$' + this.value;
                    }
                },
                plotLines: [{
                    value: 0,
                    width: 2,
                    color: 'silver'
                }]
            },
            tooltip: {
                pointFormat: '<span style="color:{series.color}">{series.name}</span>: <b>{point.y}</b><br/>',
                valueDecimals: 2
            },

            series: seriesOptions
        });
    }
});